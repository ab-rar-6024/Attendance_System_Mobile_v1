// Sidebar Clock
function updateClock(){
  document.querySelectorAll('.clock').forEach(el=>{
    el.textContent = new Date().toLocaleTimeString();
  });
}
setInterval(updateClock,1000);
updateClock();

// Punch in/out via AJAX
export async function punch(type){
  await fetch('/punch', {
    method:'POST',
    headers:{'Content-Type':'application/x-www-form-urlencoded'},
    body:`type=${type}`
  });
  alert(`Punched ${type}`);
}

// Analytics with Chart.js
export function renderAnalytics(data){
  const ctx = document.getElementById('analyticsChart').getContext('2d');
  new Chart(ctx, {
    type:'bar',
    data:{
      labels: data.dates,
      datasets:[{
        label:'Punch-ins',
        backgroundColor:'#0d6efd',
        data: data.counts
      }]
    },
    options:{
      scales:{ x:{beginAtZero:true}, y:{beginAtZero:true} }
    }
  });
}

// On Admin Reports view, fetch analytics
if(document.getElementById('analyticsChart')){
  (async()=>{
    const resp = await fetch('/analytics');
    const json = await resp.json();
    renderAnalytics(json);
  })();
}
