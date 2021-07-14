const core = require('@actions/core');
const { Toolkit } = require("actions-toolkit");
const fetch = require('node-fetch');

// reading initial inputs that will be used throughout the program
const frScheduleId = core.getInput('first-responder-schedule-id');
const rcScheduleId = core.getInput('release-coordinator-schedule-id');
var currentDate = new Date();
const startDate = currentDate.toISOString().slice(0, 10);
currentDate.setDate(currentDate.getDate() + 6);
const endDate = currentDate.toISOString().slice(0, 10);

const main = async () => {
  try {
    var releaseCoordinator = await getReleaseCoordinator();
    var firstResponder = await getFirstResponder();
    var templateContent = await readTemplateFile();

    templateContent = templateContent.replace("RELEASE_COORDINATOR_FOR_THE_WEEK", releaseCoordinator);
    templateContent = templateContent.replace("FIRST_RESPONDER_FOR_THE_WEEK", firstResponder);
    core.setOutput("templatecontent", templateContent);
  } catch (error) {
    core.setFailed(error.message);
  }
}

const readTemplateFile = async () => {
  const template = core.getInput("filename");
  const tools = new Toolkit();
  const content = await tools.readFile(template);
  return content;
}

const getFirstResponder = async() => {
  var requestOptions = {
    method: "GET",
    headers: {
        "Accept": "application/vnd.pagerduty+json;version=2",
        "Content-Type": "application/json",
        "Authorization": "Token token=" + process.env.PAGER_DUTY_API_TOKEN,
        },
    redirect: 'follow'
  };
  var requestUrl = "https://api.pagerduty.com/schedules/" + frScheduleId + "/users?since=" + startDate + "&until=" + endDate;
  
  return fetch(requestUrl, requestOptions)
  .then(response => response.json())
  .then(result => {
    return result.users[0].name;
  })
  .catch(error => console.log('error', error));
}

const getReleaseCoordinator = async() => {
  var requestOptions = {
    method: 'GET',
    headers: {
        "Accept": "application/vnd.pagerduty+json;version=2",
        "Content-Type": "application/json",
        "Authorization": "Token token=" + process.env.PAGER_DUTY_API_TOKEN,
        },
    redirect: 'follow'
  };
  var requestUrl = "https://api.pagerduty.com/schedules/" + rcScheduleId + "/users?since=" + startDate + "&until=" + endDate;
  
  return fetch(requestUrl, requestOptions)
  .then(response => response.json())
  .then(result => {
    return result.users[0].name;
  })
  .catch(error => console.log('error', error));
}

main().catch(err => core.setFailed(err.message))