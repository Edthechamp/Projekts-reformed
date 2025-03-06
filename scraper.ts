import { EklaseWrapper } from "eklasewrapper"
import { eklaseuserin, eklasepassin } from "eklasefrontend"

(async () => {
  const wrapper = new EklaseWrapper(eklaseuserin, eklasepassin);

  // Initialization

  await wrapper.launch();
  await wrapper.authenticate();

  // Obtaining data

  const recentGrades = await wrapper.scrapeRecentGrades();

  console.log(recentGrades);

   // Output

    await wrapper.stop();
  })();
  
export default EklaseWrapper;



























// cau