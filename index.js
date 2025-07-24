let api = require('@actual-app/api');
const fs = require('fs').promises;
const { DOMParser, XMLSerializer } = require('xmldom');

// Assuming the utils are part of the api module
const { integerToAmount } = api.utils; // Adjust this based on the actual structure of the module

(async () => {
  try {
    // Load credentials from creds.json
    const data = await fs.readFile('creds.json', 'utf8');
    const creds = JSON.parse(data);
    
  await api.init({  
    // Budget data will be cached locally here, in subdirectories for each file.
    dataDir: creds.dataDir, 
    // This is the URL of your running server
    serverURL: creds.serverURL,
    // This is the password you use to log into the server
    password: creds.password,
  });

  // This is the ID from Settings → Show advanced settings → Sync ID
  // if you have end-to-end encryption enabled:
  await api.downloadBudget(creds.syncid, {
    password: creds.e2epassword,
  });
  
  const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const monthText = monthNames[date.getMonth()]; // Months are 0-indexed
  const prevMonth = String(date.getMonth()).padStart(2, '0'); // Months are 0-indexed
  const Month1 = String(date.getMonth()-5).padStart(2, '0'); // Months are 0-indexed
  const Month2 = String(date.getMonth()-4).padStart(2, '0'); // Months are 0-indexed
  const Month3 = String(date.getMonth()-3).padStart(2, '0'); // Months are 0-indexed
  const Month4 = String(date.getMonth()-2).padStart(2, '0'); // Months are 0-indexed
  const Month5 = String(date.getMonth()-1).padStart(2, '0'); // Months are 0-indexed

  let budget = await api.getBudgetMonth(`${year}-${month}`);
  console.log(budget);  
  
  usualExpenses = budget.categoryGroups.find(group => group.name === 'Usual Expenses');
  food = usualExpenses.categories.find(group => group.name === 'Food');
  // how much spent on food
  console.log("Food expenditure:")
  console.log(integerToAmount(food.spent));
  
  // how much spent total this month
  console.log("Total expenditure:")
  console.log(integerToAmount(usualExpenses.spent));
  
  // how much earned this month
  console.log(`${year}-${prevMonth}`);
  let prevBudget = await api.getBudgetMonth(`${year}-${prevMonth}`);
  income = prevBudget.categoryGroups.find(group => group.name === 'Income');
  salary = income.categories.find(group => group.name === 'Salary');
  console.log("Income available:");
  console.log(integerToAmount(salary.received));
  
  // Step 1: Read the SVG file as a string
  const filePath = 'screen/screen_template.svg';
  let svgContent = await fs.readFile(filePath, 'utf8');
  
  // Parse the SVG string into an XML document
  let parser = new DOMParser();
  let svgDoc = parser.parseFromString(svgContent, "image/svg+xml");

  for (let i = 0; i <= 5; i++) {    
    // Find the element with ID "bar0"
    let bar = svgDoc.getElementById("bar" + i);      
    // Get the current date
    let currentDate = new Date();
    // Create a new date object for 6 months prior
    let monthsPrior = new Date(currentDate);
    monthsPrior.setMonth(currentDate.getMonth() - i);
    let the_year = monthsPrior.getFullYear();
    let the_month = String(monthsPrior.getMonth()).padStart(2, '0'); // Months are 0-indexed
    let the_month_text = String(monthNames[monthsPrior.getMonth()]); // Months are 0-indexed
    console.log(the_month);
    console.log(the_year);
    let month_text = svgDoc.getElementById("$b" + i);
    month_text.textContent = the_month_text;
    let amount_text = svgDoc.getElementById("$m" + i);
    let monthBudget = await api.getBudgetMonth(`${the_year}-${the_month}`);  
    let monthExpenses = monthBudget.categoryGroups.find(group => group.name === 'Usual Expenses');
    let monthFood = monthExpenses.categories.find(group => group.name === 'Food');
    amount_text.textContent = Math.abs(Math.round(integerToAmount(monthFood.spent)))+".-";
    bar.setAttribute("height", 40 * (Math.abs(integerToAmount(monthFood.spent)) / 3000));
  }

  // Step 2: Replace "$mad" with "1000"
  let mad_text = svgDoc.getElementById("$mad");
  mad_text.textContent = Math.round(Math.abs(integerToAmount(food.spent)))+".-";
  
  let maaned_text = svgDoc.getElementById("$måned");
  maaned_text.textContent = monthText; 
  
  let opdateret_text = svgDoc.getElementById("$opdateret");
  opdateret_text.textContent = date.toDateString();

  let indkomst_text = svgDoc.getElementById("$indkomst");
  indkomst_text.textContent = Math.round(Math.abs(integerToAmount(usualExpenses.spent))) + " / " + Math.round(Math.abs(integerToAmount(salary.received))) + ".- DKK" 
  
  // Serialize the XML document back to a string
  let serializer = new XMLSerializer();
  svgContent = serializer.serializeToString(svgDoc);
  
  // Step 3: Save the modified SVG content back to the file
  const fileOut = 'screen/screen_current.svg';
  await fs.writeFile(fileOut, svgContent, 'utf8');
  
  await api.shutdown();
  } catch (error) {
    console.error('Error loading credentials:', error);
  }
})();
