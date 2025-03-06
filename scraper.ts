import { EklaseWrapper } from "eklasewrapper"

const username = 
const password = 

(async () => {
  const wrapper = new EklaseWrapper(username, password);

  // Initialization

  await wrapper.launch();
  await wrapper.authenticate();

  // Obtaining data

  const recentGrades = await wrapper.scrapeRecentGrades();

  console.log(recentGrades);

   // Output

    await wrapper.stop();
  })();