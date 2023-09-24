module.exports = {
  loginCred:{
    EMAIL: process.env.EMAIL,
    PASSWORD: process.env.PASSWORD
  },

  siteInfo: {
    COUNTRY_CODE: process.env.COUNTRY_CODE || 'en-ca',
    SCHEDULE_ID: process.env.SCHEDULE_ID,
    FACILITY_ID: process.env.FACILITY_ID,

    get APPOINTMENTS_JSON_URLS(){
      const facilites = this.FACILITY_ID.split(',');
      return facilites.map(facilityId => (
        `https://ais.usvisa-info.com/${this.COUNTRY_CODE}/niv/schedule/${this.SCHEDULE_ID}/appointment/days/${facilityId}.json?appointments%5Bexpedite%5D=false`
      ));
    },

    get LOGIN_URL () {
      return `https://ais.usvisa-info.com/${this.COUNTRY_CODE}/niv/users/sign_in`
    }
  },
  IS_PROD: process.env.NODE_ENV === 'prod',
  NEXT_SCHEDULE_POLL: process.env.NEXT_SCHEDULE_POLL || 30_000, // default to 30 seconds
  MAX_NUMBER_OF_POLL: process.env.MAX_NUMBER_OF_POLL || 250, // number of polls before stopping
  NOTIFY_ON_DATE_BEFORE: process.env.NOTIFY_ON_DATE_BEFORE, // in ISO format i.e YYYY-MM-DD
  MAX_FAILS: process.env.MAX_FAILS || 3,

  NOTIFY_EMAILS: process.env.NOTIFY_EMAILS, // comma separated list of emails
  sendGrid: {
    API_KEY: process.env.SENDGRID_API_KEY,
    SENDER: process.env.SENDGRID_SENDER,
  }
}
