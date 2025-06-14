import { sendEmail } from "@/actions/send-email";
import {inngest} from "./client"
import { db } from "@/lib/prisma"
import EmailTemplate from "@/emails/my-email";
import { GoogleGenerativeAI } from "@google/generative-ai";
// Inngest function that runs every 6 hours to check if any budget exceeds 80% usage.
export const checkBudgetAlerts = inngest.createFunction(
    { name: "Check Budget Alerts" },
    { cron: "0 */6 * * *" }, // Runs every 6 hours
  
    async ({ step }) => {
      // Step 1: Fetch all budgets along with each user's default account
      const budgets = await step.run("fetch-budgets", async () => {
        return await db.budget.findMany({
          include: {
            user: {
              include: {
                accounts: {
                  where: { isDefault: true }, // Only fetch the default account
                },
              },
            },
          },
        });
      });
  
      // Step 2: Iterate through each budget
      for (const budget of budgets) {
        const defaultAccount = budget.user.accounts[0];
  
        // Skip this budget if user doesn't have a default account
        if (!defaultAccount) continue;
  
        // Step 3: Calculate total expenses for this budget's default account in the current month
        const expenses = await step.run(`check-budget-${budget.id}`, async () => {
          const startDate = new Date();
          startDate.setDate(1); // Start of current month
  
          return await db.transaction.aggregate({
            where: {
              userId: budget.userId,
              accountId: defaultAccount.id, // Only default account's transactions
              type: "EXPENSE",              // Only expenses
              date: { gte: startDate },     // Only from start of the current month
            },
            _sum: {
              amount: true,                 // Sum of amounts
            },
          });
        });
  
        // Step 4: Calculate how much of the budget has been used
        const totalExpenses = Number(expenses._sum.amount ?? 0);
        const budgetAmount = budget.amount;
  
        // If budget is zero (avoid division by zero), skip
        if (budgetAmount === 0) continue;
  
        const percentageUsed = (totalExpenses / budgetAmount) * 100;
  
        // Step 5: If usage > 80% and no alert has been sent this month, send alert and update DB
        const shouldSendAlert =
          percentageUsed >= 80 &&
          (!budget.lastAlertSent || isNewMonth(new Date(budget.lastAlertSent), new Date()));
  
        if (shouldSendAlert) {
          // You can plug in your email logic here (e.g. using Resend)
          // console.log(`Sending alert to ${budget.user.email} — ${percentageUsed.toFixed(2)}% used`);
           await sendEmail({
            to: budget.user.email,
            subject: `Budget Alert for ${defaultAccount.name}`,
            react: EmailTemplate({
              type: "budget-alert",
              userName: budget.user.name || "User",
              data: {
                percentageUsed,
                budgetAmount,
                totalExpenses,
              },
            }),
          });
  
          // Update the lastAlertSent field so we don’t send duplicate alerts
          await db.budget.update({
            where: { id: budget.id },
            data: { lastAlertSent: new Date() },
          });
        }
      }
    }
  );
  
  // Utility function to check if the last alert was in a different month
  function isNewMonth(lastAlertDate, currentDate) {
    return (
      lastAlertDate.getMonth() !== currentDate.getMonth() ||
      lastAlertDate.getFullYear() !== currentDate.getFullYear()
    );
  }
  
  // Trigger recurring transactions with batching
  export const triggerRecurringTransactions =inngest.createFunction({
    id:"trigger-recurring-transactions", // unique id 
    name:"Trigger Recurring Transactions",
  },{cron : "0 0 * * *"}, // Daily midnight 
  async ({step})=>{
    // 1. Fetch all due recurring transactions
    const recurringTransactions = await step.run(
      "fetch-recurring-transactions",
      async () => {
        return await db.transaction.findMany({
          where:{
            isRecurring :true,
            status :"COMPLETED",
            OR:[
              {lastProcessed :null}, //Never processed
              {nextRecurringDate: {lte:new Date() }}, //Due data passed 
            ],
          },
        });
      }
    );

    // 2. Create events for each transactions
    //  Send event for each recurring transaction in batches
    if (recurringTransactions.length > 0 ) {
      const events =recurringTransactions.map((transaction) => ({
        name : "transaction.recurring.process",
        data :{transactionId: transaction.id, userId: transaction.userId },
      }));
  
      // 3. Send events to be processed
      //  Send events directly using inngest.send()
      await inngest.send(events);
    }
  
    return { triggered : recurringTransactions.length };
  }
  );

  // Recurring Transaction Processing using Throttling
  export const processRecurringTransaction = inngest.createFunction(
    {
      id: "process-recurring-transaction",
      name: "Process Recurring Transaction",
      throttle: {
        limit: 10, // Process 10 transactions
        period: "1m", // per minute
        key: "event.data.userId", // Throttle per user
      },
    },
    { event: "transaction.recurring.process" },
    async ({ event, step }) => {
      // Validate event data
      if (!event?.data?.transactionId || !event?.data?.userId) {
        console.error("Invalid event data:", event);
        return { error: "Missing required event data" };
      }
  
      await step.run("process-transaction", async () => {
        const transaction = await db.transaction.findUnique({
          where: {
            id: event.data.transactionId,
            userId: event.data.userId,
          },
          include: {
            account: true,
          },
        });
  
        if (!transaction || !isTransactionDue(transaction)) return;
  
        // Create new transaction and update account balance in a transaction
        await db.$transaction(async (tx) => {
          const now = new Date();
          let nextDate = transaction.lastProcessed
            ? new Date(transaction.nextRecurringDate)
            : new Date(transaction.date); // fallback for first time
        
          const transactionsToCreate = [];
        
          // While nextDate is before or equal to now (ignore time portion)
          while (nextDate <= now) {
            // Only add transaction if it's for a day before today OR has not yet been added today
            const nextDateStart = new Date(nextDate.toDateString());
            const nowStart = new Date(now.toDateString());
        
            if (nextDateStart < nowStart) {
              transactionsToCreate.push({
                type: transaction.type,
                amount: transaction.amount,
                description: `${transaction.description} (Recurring)`,
                date: new Date(nextDate),
                category: transaction.category,
                userId: transaction.userId,
                accountId: transaction.accountId,
                isRecurring: false,
              });
            }
        
            // Move to next recurring date
            nextDate = calculateNextRecurringDate(nextDate, transaction.recurringInterval);
          }
        
          if (transactionsToCreate.length > 0) {
            // Create all missed transactions
            await tx.transaction.createMany({
              data: transactionsToCreate,
            });
        
            // Compute total amount change
            const totalAmount = transactionsToCreate.reduce((sum, t) => {
              const amt = t.amount?.toNumber?.() ?? t.amount;
              return sum + (t.type === "EXPENSE" ? -amt : amt);
            }, 0);
        
            // Update account balance
            await tx.account.update({
              where: { id: transaction.accountId },
              data: { balance: { increment: totalAmount } },
            });
          }
        
          // Always update lastProcessed and nextRecurringDate
          await tx.transaction.update({
            where: { id: transaction.id },
            data: {
              lastProcessed: now,
              nextRecurringDate: nextDate,
            },
          });
        });        
        
      });
    }
  );

   // helper function to calculate the next recurring date based on the interval
 function calculateNextRecurringDate(startDate, interval){
  const date = new Date(startDate);

  switch (interval){
      case "DAILY":
          date.setDate(date.getDate() + 1);
          break;
      case "WEEKLY":
          date.setDate(date.getDate() + 7);
          break;
      case "MONTHLY":
          date.setMonth(date.getMonth() + 1);
          break;
      case "YEARLY":
          date.setFullYear(date.getFullYear() + 1);
          break;
      default:
          throw new Error("Invalid recurring interval");
  }
  return date;
}
  
// Utility functions
function isTransactionDue(transaction) {
  // If no lastProcessed date, transaction is due
  if (!transaction.lastProcessed) return true;

  const today = new Date();
  const nextDue = new Date(transaction.nextRecurringDate);

  // Compare with nextDue date
  return nextDue <= today;
}

// function for getting the month report for the user
export const generateMonthlyReport = inngest.createFunction(
  {name:"Generate Monthly Report",
    id:"generate-monthly-report"
    },
  {cron:"0 0 1 * *" }, // Runs on the first day of every month at midnight
  async ({step}) => {
    const users = await step.run("fetch-users", async () => {
      return await db.user.findMany({
        include:{
          accounts:true
        },
      });
    });

    for (const user of users){
      // for every user 
       await step.run(`generate-report-for-${user.id}`, async () => {
        const lastMonth =new Date();
        lastMonth.setMonth(lastMonth.getMonth() -1);

        const stats =await getMonthlyStats(user.id,lastMonth);
        const monthName =lastMonth.toLocaleString('default', { month: 'long',
       });
       // Generate insights and send email
       const insights = await generateFinancialInsights(stats,monthName);

       await sendEmail({
        to: user.email,
        subject: `Your Monthly Financial Report - ${monthName}`,
        react: EmailTemplate({
          type: "monthly-report",
          userName: user.name || "User",
          data: {
          stats,
          month: monthName,
          insights,
          },
        }),
      });
     })
    }
    return { processed :users.length };
  }
);
// function for generating the financial insights using Google Generative AI
async function generateFinancialInsights(stats, monthName) {
  const genAI= new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({model:"gemini-1.5-flash"});

  const prompt = `
  Analyze this financial data and provide 3 concise, actionable insights.
  Focus on spending patterns and practical advice.
  Keep it friendly and conversational.

  Financial Data for ${monthName}:
  - Total Income: $${stats.totalIncome}
  - Total Expenses: $${stats.totalExpenses}
  - Net Income: $${stats.totalIncome - stats.totalExpenses}
  - Expense Categories: ${Object.entries(stats.byCategory)
    .map(([category, amount]) => `${category}: $${amount}`)
    .join(", ")}

  Format the response as a JSON array of strings, like this:
  ["insight 1", "insight 2", "insight 3"]
`;
try{
  // giving the prompt to generate the insights
  const result = await model.generateContent(prompt);
  // result.response is a promise, so we need to await it
  const response = await result.response;
  // response.text() is also a promise, so we need to await it
  const text = await response.text();
  // removing json from starting and ending 
  const cleanedText = text.replace(/```(?:json)?\n?/g,"").trim();

  // Log the cleaned text for debugging
  console.log("Generated Insights:", cleanedText);

  return JSON.parse(cleanedText);


}catch(error){
  console.error("Error generating insights:", error);
    return [
      "Your highest expense category this month might need attention.",
      "Consider setting up a budget for better financial management.",
      "Track your recurring expenses to identify potential savings.",
    ];
} 
}
// function for getting the monthly stats for the user
const getMonthlyStats=async (userId,month)=>{
  const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
  const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0); // Last day of the month

  const transactions = await db.transaction.findMany({
    where:{
      userId:userId,
      date:{
        lte: endDate,
        gte:startDate,
      },
    },
  });
  return transactions.reduce(
    (stats, t)=>{
      const amount = t.amount?.toNumber();
      if(t.type ==="EXPENSE"){
        stats.totalExpenses += amount;
        const category = t.category || "Uncategorized";
        stats.byCategory[category] = (stats.byCategory[category] || 0) + amount;
      }
      else{
        stats.totalIncome += amount;
      }
      return stats;
    },
    {
      totalExpenses: 0,
      totalIncome: 0,
      byCategory: {},
      transactionsCount: transactions.length,
    }
  );

};
