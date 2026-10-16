/* ---------- defaults for a brand-new workshop ---------- */
const DEFAULT_SERVICES=[
 ['Engine','Engine oil change',2.5,3.5,'oil'],['Engine','Air filter replace',1,1.5],['Engine','Spark plugs (4 cyl)',6,6],['Engine','Spark plugs (6/8 cyl)',10,10],['Engine','Throttle body cleaning',2,2],['Engine','Engine bay cleaning',1,1.5],
 ['Brakes','Front brake pads',4,5],['Brakes','Rear brake pads',4,5],['Brakes','Brake service (front + rear)',10,12],['Brakes','Brake fluid flush',8,8],['Brakes','Rotor disc turning (pair)',4,4],['Brakes','Brake check',1,1],
 ['Transmission','Gearbox oil drain & refill',10,12,'gear'],['Transmission','Gearbox oil & filter',14,16,'gear'],['Transmission','Differential oil',4,5],['Transmission','Transfer case oil',4,5],
 ['Cooling','Coolant change',3,4],['Cooling','Radiator flush',6,8],['Cooling','AC gas refill',10,12],['Cooling','AC service',15,18],['Cooling','Cabin (AC) filter',1,1],
 ['Suspension','Link rods (pair)',4,5],['Suspension','Front lower arm',4,6],['Suspension','Shock absorbers (pair)',8,10],['Suspension','Wheel alignment',5,6],['Suspension','Tire rotation',1.5,2],['Suspension','Tire change (each)',1,1.5],
 ['Electrical','Battery replace',2,2],['Electrical','Battery test',0,0],['Electrical','Bulb replace',1,1],['Electrical','OBD scan',5,5],
 ['Belts','Engine belts',4,6],['Belts','Timing belt',25,35],
 ['Inspection','Maintenance check',5,5],['Inspection','Pre-purchase inspection',10,12],['Inspection','Diagnosis',5,5],
 ['Detailing','Car wash',2.5,3]
];
const DEFAULT_PART_CATS=['Engine oil','Oil filters','Air filters','Cabin filters','Brake pads','Brake fluid','Coolant','Gearbox oil','Spark plugs','Batteries','Bulbs','Belts','Additives','Other'];
const DEFAULT_EXP_CATS=['Rent','Salaries','Electricity','Water','Internet','Workshop supplies','Tools','Marketing','Transport','Other'];
const DEFAULT_INSP=[
 {id:'i1',name:'Quick check',items:['Engine oil','Coolant','Brake fluid','Air filter','Wiper blades','Brake pads','Tires','Lights','Battery','Horn']},
 {id:'i2',name:'Service inspection',items:['Engine mounts','Engine oil','Coolant','Brake fluid','Battery','Gearbox oil','Hoses','Belts','Front brake pads','Rear brake pads','Rotors','Steering boots','Tie rod ends','Link rods','Ball joints','Shocks','Bushings','Hub bearings','Lights','Tires']},
 {id:'i3',name:'Pre-purchase',items:['Accident / repaint','Chassis','Engine noise','Oil leaks','Exhaust smoke','Gearbox shifting','Mounts','CV boots','Suspension','Steering','Brakes','OBD scan','AC','Electrics','Interior','Tires']}
];
/* The 100 steps. auto = key of a check that ticks itself when the data shows it is done. */
const STEPS=[
 ['w1','Week 1 · The basics',[
  ['Workshop name, phone and address','profile'],['Upload your logo','logo'],['Currency OMR, 3 decimals','cur'],['Time zone Muscat'],['Decide VAT (off if not registered)','vat'],
  ['Invoice numbers start (e.g. 1001)','invno'],['Warranty text on invoices','warranty'],['Payment methods','pay'],['Credit days for unpaid invoices','cred'],['Owner account with a PIN','owner'],
  ['Add a manager','manager'],['Add your workers','worker'],['Workers can\'t see cost or give discounts'],['Only the owner deletes'],['Print a test invoice on paper'],
  ['Open the test invoice on a phone'],['Connect the sticker printer'],['Install the app on every tablet and phone'],['Log in on each device'],['Write down who is allowed to do what'],
  ['Choose the reminder interval for engine oil','remind'],['Write the reminder message','remmsg'],['Decide opening hours'],['Decide who opens and closes'],['Make a backup','backup']]],
 ['w2','Week 2 · Lists',[
  ['Check the default services and prices','svc'],['Remove services you will not do'],['Add your own services','svcadd'],['Sedan vs SUV prices'],['A clear price for Diagnosis'],
  ['Part categories','pcat'],['One naming rule for parts (brand · type · number · size)'],['Add the engine oils you will sell','oils'],['Add oil filters for common cars','filters'],['Unit for each part (pc / L / set)'],
  ['Selling price for each part','pprice'],['Cost for each part (owner only)','pcost'],['Reorder level for fast items','reorder'],['No duplicate parts'],['Add your suppliers','vendors'],
  ['For each supplier: what, when, how to pay'],['Make the first order in the app','po'],['Receive the order in the app','porec'],['Count the shelf before opening'],['Canned jobs for the top cars','canned'],
  ['Canned jobs for brakes and gearbox'],['Test each canned job total'],['Inspection templates','insp'],['Keep inspections short (15–20 items)'],['Expense categories','expcat'],
  ['Enter fixed monthly expenses','exp'],['Add the workshop tools as an expense'],['Set opening cash'],['Decide the cash drawer routine'],['Second backup','backup2']]],
 ['w3','Week 3 · Practice',[
  ['Add 5 test customers','cust5'],['Open a full job: check-in, inspection, estimate','job1'],['Send an estimate on WhatsApp'],['Turn an estimate into a job','est2job'],['Turn a job into an invoice','inv1'],
  ['Take cash, card and credit payments','pay3'],['Do a return and see stock come back','ret'],['Discount by amount and by %'],['Add a part bought outside','outside'],['Print a sticker'],
  ['Check the reminder was saved','rem1'],['Look at today\'s report'],['Look at the stock report'],['Delete all test data'],['Train each worker for one hour'],
  ['Each worker does 3 test jobs'],['One-page how-to on the wall'],['Rule: no car without a job card'],['Rule: no part leaves the shelf without a job'],['Photo of the card and the km at check-in'],
  ['Who invoices, who takes money'],['Cash drawer and daily close','close1'],['Connect WhatsApp Business'],['Ready messages: car ready, estimate, reminder'],['Google Maps page and reviews']]],
 ['w4','Week 4 · Opening and after',[
  ['Day one: every car gets a job'],['End of day: match cash with payments','close1'],['End of day: every job closed or has a reason'],['First week: count 5 items each morning','count1'],['Record outside parts the same day'],
  ['Check prices workers changed'],['Follow up estimates with no answer'],['End of week: top 10 services and parts'],['Fix reorder levels from real use'],['Add services customers asked for'],
  ['Remove services nobody asked for'],['First month: sales vs expenses'],['Call the oldest unpaid invoices'],['Send the first reminders'],['Busiest day and hour → staff hours'],
  ['Review worker permissions'],['Fix customer and car mistakes as you go'],['Routine: morning count, noon follow-up, night close'],['Monthly: backup and profit report'],['After 3 months: hide what you never use']]]
];
