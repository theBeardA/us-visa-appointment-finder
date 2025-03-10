const puppeteer = require('puppeteer');
const {parseISO, compareAsc, isBefore, format} = require('date-fns')
require('dotenv').config();

const {delay, sendEmail, logStep} = require('./utils');
const {siteInfo, loginCred, IS_PROD, NEXT_SCHEDULE_POLL, MAX_NUMBER_OF_POLL, NOTIFY_ON_DATE_BEFORE, MAX_FAILS} = require('./config');

let isLoggedIn = false;
let maxTries = MAX_NUMBER_OF_POLL;
let maxFails = MAX_FAILS;
let errorCounter = 0;
let failureReasons = [];


const login = async (page) => {
  logStep('logging in');
  await page.goto(siteInfo.LOGIN_URL);

  const form = await page.$("form#sign_in_form");

  const email = await form.$('input[name="user[email]"]');
  const password = await form.$('input[name="user[password]"]');
  const privacyTerms = await form.$('input[name="policy_confirmed"]');
  const signInButton = await form.$('input[name="commit"]');

  await email.type(loginCred.EMAIL);
  await password.type(loginCred.PASSWORD);
  await privacyTerms.click();
  await signInButton.click();

  await page.waitForNavigation();

  return true;
}

const notifyMe = async (earliestDate) => {
  const formattedDate = format(earliestDate, 'dd-MM-yyyy');
  logStep(`sending an email to schedule for ${formattedDate}`);
  await sendEmail({
    subject: `We found an earlier date ${formattedDate}`,
    text: `Hurry and schedule for ${formattedDate} before it is taken.`
  })
}

const notifyFailure = async (errors) => {
  logStep(`sending an email for failure`);
  await sendEmail({
    subject: `The script is failing`,
    text: `The script failed ${maxFails} times due to the followin errors: \n
    ${errors}`,
  })
}
const getDatesForFacility = async (page, url) => {
  await page.goto(url);
  const originalPageContent = await page.content();
  try{
    const bodyText = await page.evaluate(() => {
      return document.querySelector('body').innerText
    });
    // console.log(bodyText);
    const parsedBody =  JSON.parse(bodyText);

    if(!Array.isArray(parsedBody)) {
      throw "Failed to parse dates, probably because you are not logged in";
    }

    const dates =parsedBody.map(item => parseISO(item.date));
    return dates;
  }catch(err){
    console.log("Unable to parse page JSON content", originalPageContent);
    console.error(err)
    isLoggedIn = false;
  }
}
const checkForSchedules = async (page) => {
  logStep('checking for schedules');
  await page.setExtraHTTPHeaders({
    'Accept': 'application/json, text/javascript, */*; q=0.01',
    'X-Requested-With': 'XMLHttpRequest'
  });
  const combinedDates = [];
  for (let url of siteInfo.APPOINTMENTS_JSON_URLS) {
    const dates = await getDatesForFacility(page, url);
    combinedDates.push(...dates);
  }
  const [earliest] = combinedDates.sort(compareAsc)
  return earliest;
}


const process = async (browser) => {
  logStep(`starting process with ${maxTries} tries left`);

  if(maxTries-- <= 0){
    console.log('Reached Max tries')
    return
  }

  const page = await browser.newPage();

  if(!isLoggedIn) {
     isLoggedIn = await login(page);
  }

  const earliestDate = await checkForSchedules(page);
  if(earliestDate && isBefore(earliestDate, parseISO(NOTIFY_ON_DATE_BEFORE))){
    await notifyMe(earliestDate);
  }

  await delay(NEXT_SCHEDULE_POLL)

  await process(browser)
}


const startTask = async () => {
  const browser = await puppeteer.launch(!IS_PROD ? {headless: false}: undefined);

  try{
    await process(browser);
    errorCounter = 0;
  }catch(err){
    console.error(err);
    failureReasons.push(err);
    errorCounter++;
  }

  await browser.close();

  if (errorCounter === maxFails) {
    notifyFailure(failureReasons)
    return;
  }

  console.log("starting cool down period now before restarting after 10 mins")
  setTimeout(startTask, 10 * 60 * 1000); // 10 minutes in milliseconds
};

(async() => {
  startTask();
})();
