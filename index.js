const core = require('@actions/core');
const { Toolkit } = require("actions-toolkit");
const fetch = require('node-fetch');

// reading initial inputs that will be used throughout the program
const frScheduleId = core.getInput('first-responder-schedule-id');
const rcScheduleId = core.getInput('release-coordinator-schedule-id');
const releaseCoordinatorPlaceholder = core.getInput("release-coordinator-placeholder-text");
const firstResponderPlaceholder = core.getInput("first-responder-placeholder-text");
const upcomingReleaseCoordinatorPlaceholder = core.getInput("upcoming-release-coordinator-placeholder-text");
const upcomingFirstResponderPlaceholder = core.getInput("upcoming-first-responder-placeholder-text");
const teamMembers = core.getInput("team-alias") || ""

var startDate, endDate, nextWeekStart, nextWeekEnd;
var requestOptions;

const main = async () => {
  try {
    setValues();
    var releaseCoordinator = await getUserName(rcScheduleId, startDate, endDate);
    var firstResponder = await getUserName(frScheduleId, startDate, endDate);
    var releaseCoordinatorUpcoming = await getUserName(rcScheduleId, nextWeekStart, nextWeekEnd);
    var firstResponderUpcoming = await getUserName(frScheduleId, nextWeekStart, nextWeekEnd);
    var templateContent = await readTemplateFile();
    var teamAlias = getTeamMembers();

    if (!teamAlias.includes(releaseCoordinator)) releaseCoordinator = '`' + releaseCoordinator + '`';
    if (!teamAlias.includes(firstResponder)) firstResponder = '`' + firstResponder + '`';
    if (!teamAlias.includes(releaseCoordinatorUpcoming)) releaseCoordinatorUpcoming = '`' + releaseCoordinatorUpcoming + '`';
    if (!teamAlias.includes(firstResponderUpcoming)) firstResponderUpcoming = '`' + firstResponderUpcoming + '`';

    templateContent = templateContent.replace(releaseCoordinatorPlaceholder, releaseCoordinator);
    templateContent = templateContent.replace(firstResponderPlaceholder, firstResponder);
    templateContent = templateContent.replace(upcomingReleaseCoordinatorPlaceholder, releaseCoordinatorUpcoming);
    templateContent = templateContent.replace(upcomingFirstResponderPlaceholder, firstResponderUpcoming);

    core.setOutput("templatecontent", templateContent);
  } catch (error) {
    core.setFailed(error.message);
  }
}

const setValues = () => {
  var currentDate = new Date();
  currentDate.setDate(currentDate.getDate() + 1); // since this is created on mondays and since that's when it changes, setting start date to tuesday
  startDate = currentDate.toISOString().slice(0, 10);
  currentDate.setDate(currentDate.getDate() + 1); // end date will be wednesday which should cover the whole week 
  endDate = currentDate.toISOString().slice(0, 10);
  currentDate.setDate(currentDate.getDate() + 6);
  nextWeekStart = currentDate.toISOString().slice(0, 10);
  currentDate.setDate(currentDate.getDate() + 1);
  nextWeekEnd = currentDate.toISOString().slice(0, 10);
  
  requestOptions = {
    method: 'GET',
    headers: {
        "Accept": "application/vnd.pagerduty+json;version=2",
        "Content-Type": "application/json",
        "Authorization": "Token token=" + process.env.PAGER_DUTY_API_TOKEN,
        },
    redirect: 'follow'
  };
}

const getTeamMembers = () => {
  if (teamMembers === ""){
    return []
  }
  return teamMembers.split(",");
}

const readTemplateFile = async () => {
  const template = core.getInput("filename");
  const tools = new Toolkit();
  const content = await tools.readFile(template);
  return content;
}

const getUserName = async(scheduleId, startDate, endDate) => {
  var requestUrl = "https://api.pagerduty.com/schedules/" + scheduleId + "/users?since=" + startDate + "&until=" + endDate;
  return fetch(requestUrl, requestOptions)
  .then(response => response.json())
  .then(result => {
    return result.users[0].name;
  })
  .catch(error => console.log('error', error));
}

main().catch(err => core.setFailed(err.message))