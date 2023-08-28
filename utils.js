const sgMail = require('@sendgrid/mail')
const config = require('./config');
sgMail.setApiKey(config.sendGrid.API_KEY);
const debug = async (page, logName, saveScreenShot) => {
  if(saveScreenShot){
    await page.screenshot({path: `${logName}.png`});
  }

  await page.evaluate(() => {
    debugger;
  });
};

const delay = timeout => new Promise(resolve => setTimeout(resolve, timeout));

const sendEmail = async (params) => {
  const from = config.sendGrid.SENDER;
  const data = {
    from,
    to: config.NOTIFY_EMAILS,
    subject: 'Hello US VISA schedules',
    ...params
  };
  try {
    await sgMail.send(data);
  } catch(error) {
    console.log(error.response.body);
  }
};

const logStep = (stepTitle) => {
  console.log("=====>>> Step:", stepTitle);
}

module.exports = {
  debug,
  delay,
  sendEmail,
  logStep
}
