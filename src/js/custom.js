/////////////////////
//    Constants    //
/////////////////////
const BAR_WIDTH = 45;
const X_AXIS_HEIGHT = 39;
const Y_AXIS_WIDTH = 12;
const COLORS = [
  [255, 26, 104],
  [54, 162, 235],
  [255, 206, 86],
  [75, 192, 192],
  [153, 102, 255],
  [255, 159, 64]
];
const CALENDARS = document.getElementById('calendars');
const charts = [];

const startOfWeek = new Date();   // This week's Monday at 12:00 AM
const day = startOfWeek.getDay() || 7;
if (day !== 1) {
  startOfWeek.setHours(-24 * (day - 1));
} else {
  startOfWeek.setHours(0);
}
startOfWeek.setMinutes(0);
startOfWeek.setSeconds(0);
console.log('Start of this week:', startOfWeek);

const today = new Date();     // Today at 12:00 AM
today.setHours(0);
today.setMinutes(0);
today.setSeconds(0);


////////////////////////////
//    Global Variables    //
////////////////////////////
let numDays = 7;
let reference = today;


////////////////////////////
//    Helper Functions    //
////////////////////////////
function msToDays(ms) {
  return ms / (1000 * 60 * 60 * 24);
}

function formatDaysHours(days, hours) {
  const plural = (value) => (value !== 1 ? 's' : '');
  let result = '';
  if (days > 0) {
    result += `${days} day${plural(days)}`;
  }
  if (hours > 0) {
    if (days > 0) {
      result += ', ';
    }
    if (hours >= 1) {
      const value = Math.floor(hours);
      result += `${value} hour${plural(value)}`;
    } else {
      const value = Math.floor(60 * hours);
      result += `${value} minute${plural(value)}`;
    }
  }
  return result;
}


///////////////////////
//    Main Script    //
///////////////////////
function main() {
  for (const [i, courseName] of Object.entries(Object.keys(assignments))) {
    const entries = assignments[courseName];    // Get assignment list for this course

    // Prepare data
    const presentEntries = [];    // List of assignments that are due on or after today
    const titles = [];
    const dueDates = [];
    const backgroundColors = [];
    const borderColors = [];
    const color = COLORS[i % COLORS.length];
    const background = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.2)`;
    const border = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 1.0)`;
    const inactiveBackground = `rgba(0, 0, 0, 0.05)`;
    const inactiveBorder = `rgba(0, 0, 0, 0.25)`;
    for (let entry of entries) {
      const dueDate = new Date(entry.dueDate);
      const daysFromReference = msToDays(dueDate - reference);
      if (daysFromReference > 0) {
        presentEntries.push(entry);
        titles.push(entry.title);
        dueDates.push(daysFromReference);
        if (!entry.submitted) {
          if (daysFromReference > numDays) {
            // No border for assignments that extend past display window
            backgroundColors.push(background);
            borderColors.push(background);
          } else {
            backgroundColors.push(background);
            borderColors.push(border);
          }
        } else {
          backgroundColors.push(inactiveBackground);
          borderColors.push(inactiveBorder);
        }
      }
    }

    // Prepare HTML for charts
    const div = document.createElement('div');
    div.className = 'mb-5';
    
    const courseTitle = document.createElement('p');
    courseTitle.textContent = courseName;
    courseTitle.style.fontSize = '1.25rem';
    div.appendChild(courseTitle);

    const calendarContainer = document.createElement('div');
    calendarContainer.style.height = `${presentEntries.length * BAR_WIDTH + X_AXIS_HEIGHT}px`;
    calendarContainer.style.marginRight = `${Y_AXIS_WIDTH}px`;

    const canvas = document.createElement('canvas');
    calendarContainer.appendChild(canvas);

    div.appendChild(calendarContainer);
    CALENDARS.appendChild(div);

    // Display barchart of assignments
    const data = {
      labels: titles,
      datasets: [{
        label: 'Days Left',
        data: dueDates,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 1,
        barPercentage: 0.8,
        categoryPercentage: 1.0
      }]
    };

    const config = {
      type: 'bar',
      data,
      options: {
        maintainAspectRatio: false,
        indexAxis: 'y',
        scales: {
          x: {
            max: numDays,
            grid: {
              drawBorder: false
            },
            ticks: {
              autoSkip: false,
              align: 'end',
              callback: (val, i) => {
                const date = new Date(today.getTime());
                date.setHours(24 * (i - 1));
                const dateString = date.toLocaleDateString('en-us', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric'
                });
                return i > 0 ? dateString : '';
              }
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              display: false,
              drawBorder: false
            },
            ticks: {
              mirror: true
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          annotation: {
            annotations: {
              now: {
                type: 'line',
                mode: 'vertical',
                scaleID: 'x',
                value: msToDays((new Date()) - reference),
                borderWidth: 1,
                borderColor: 'rgb(255, 0, 0, 0.5)'
              }
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const date = new Date(presentEntries[context.dataIndex].dueDate);
                const diff = msToDays(date - (new Date()));
                const days = Math.floor(diff);
                const hours = 24 * (diff - days);

                // Display time remaining
                if (days <= 0 && hours <= 0) {
                  return 'Due date has passed';
                } else {
                  return formatDaysHours(days, hours) + ' left';
                }
              },
              afterLabel: (context) => {
                const date = new Date(presentEntries[context.dataIndex].dueDate);
                const dateString = date.toLocaleDateString('en-us', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric'
                });
                const timeString = date.toLocaleTimeString('en-us', {
                  hour: 'numeric',
                  minute: '2-digit'
                });
                return `${dateString} @ ${timeString}`;
              }
            }
          }
        }
      }
    };

    const chart = new Chart(
      canvas,
      config
    );

    // Visit link to assignment on click
    canvas.onclick = (e) => {
      const options = {
        intersect: true, 
        axis: 'y'
      };
      const points = chart.getElementsAtEventForMode(e, 'nearest', options, true);
      if (points.length > 0) {
        const point = points[0];
        window.open(presentEntries[point.index].link, '_blank').focus();
      }
    };
    charts.push(chart);
    // console.log(canvas.clientHeight - chart.chartArea.height);     // Calculate height of x-axis labels
  }
}


function refresh() {
  // Display current time
  const now = new Date();
  const dateString = now.toLocaleDateString('en-us', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
  const timeString = now.toLocaleTimeString('en-us', {
    hour: 'numeric',
    minute: '2-digit'
  });
  document.getElementById('now').textContent = `${dateString} - ${timeString}`;

  // Refresh charts
  for (const chart of charts) {
    const daysToDueDate = msToDays(now - reference);
    chart.options.plugins.annotation.annotations.now.value = daysToDueDate;
    chart.update();
  }

  console.log('Refreshed');
  setTimeout(refresh, 1000);
}


// Generate charts and periodically refresh
main();
refresh();
