import '../css/history.css';
import Axios from 'axios';
import Highcharts from 'highcharts/highstock';
import Exporting from 'highcharts/modules/exporting';

Exporting(Highcharts);

const recordsHTML = `
<div class="colname">
  <div class="date">매매날짜</div>
  <div class="code">종목코드</div>
  <div class="action">주문</div>
  <div class="amount">수량</div>
  <div class="price">가격</div>
</div>
{0}
`;

const recordHTML = `
<div class="record">
  <div class="date">{0}</div>
  <div class="code">{1}</div>
  <div class="action {5}">{2}</div>
  <div class="amount">{3}</div>
  <div class="price">{4}</div>
</div>
`;

const getCookie = (key) => {
  const name = `${key}=`;
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i += 1) {
    let c = ca[i];
    while (c.charAt(0) === ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) === 0) {
      return c.substring(name.length, c.length);
    }
  }
  return '';
};

const formatString = (stringValue, replacementsArray) => {
  let formatted = stringValue;
  for (let i = 0; i < replacementsArray.length; i += 1) {
      const regexp = new RegExp(`\\{${i}\\}`, 'gi');
      formatted = formatted.replace(regexp, replacementsArray[i]);
  }
  return formatted;
};

const downloadCSV = (data) => {
  let csv = '날짜,종목,주문구분,수량,체결가\n';
  data.forEach((row) => {
          csv += row.join(',');
          csv += "\n";
  });

  console.log(csv);
  let hiddenElement = document.createElement('a');
  hiddenElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
  hiddenElement.target = '_blank';
  hiddenElement.download = 'srk_trade_history.csv';
  hiddenElement.click();
}

Highcharts.setOptions({
  lang: {
    months: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
    shortMonths: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
    weekdays: ['월', '화', '수', '목', '금', '토', '일'],
  }
});

const drawPortHistoryChart = (seriesData) => {
  // let seriesData = [[Date.UTC(2020, 0, 1), 100], [Date.UTC(2020, 0, 2), 105], [Date.UTC(2020, 0, 3), 97]]
  Highcharts.stockChart('chart-area', {
    chart: {
      backgroundColor: '#f7f7f7',
      style: { fontFamily: 'NotoSans', },
    },
    rangeSelector: {
      inputEnabled:false,
      buttonTheme: { // styles for the buttons
        fill: 'none',
        stroke: 'none',
        'stroke-width': 0,
        r: 8,
        style: {
          color: '#4564ff',
          fontWeight: 'bold'
        },
        states: {
          hover: {
          },
          select: {
            fill: '#4564ff',
            style: {
              color: 'white'
            }
          }
          // disabled: { ... }
        }
      },
      inputBoxBorderColor: 'gray',
      inputBoxWidth: 120,
      inputBoxHeight: 18,
      inputStyle: {
        color: '#4564ff',
        fontWeight: 'bold'
      },
      labelStyle: {
        color: 'silver',
        fontWeight: 'bold'
      },
      selected: 1
    },
    navigator : { enabled : false, },
    credits: { enabled: false, },
    exporting: { enabled: false, },
    scrollbar: { enabled: false, },
    title: { text: '', },
    series: [{
      name: '수익',
      data: seriesData,
      type: 'spline',
      tooltip: {
          valueDecimals: 2,
      },
      color: {
        linearGradient: {
            x1: 0,
            y1: 0,
            x2: 0,
            y2: 1,
        },
        stops: [
            [0, '#ff9cf3'],
            [0.5, '#ffaa6e'],
            [1, '#866bff'],
        ],
      },
    },],
  });
};

const TOKEN = getCookie('PP-PAGE-TOKEN');
const ID = getCookie('PP-PAGE-ID');
const MONITORSTOCKURL = 'https://api.peepeespace.com/quant/monitorstock/';
const PORTHISTORYURL = 'https://api.peepeespace.com/quant/porthistory/';
const OPTIONS = {
  headers: {'Authorization': `Token ${TOKEN}`}
};

const getPortHistoryData = async () => {
  const userSpecificURL = formatString(`{0}?user={1}`, [PORTHISTORYURL, ID])
  const getRes = await Axios.get(userSpecificURL, OPTIONS);
  const returnData = getRes.data.results;

  const records = [];
  const portfolio = {};
  const totalProfitHist = [];
  const totalProfitHistPct = [0];
  const cumProfitHist = [];
  const yieldCurve = [];
  const dateList = [];
  let chartData = [];

  for (let history of returnData) {
      let date = history.date;
      let stockCode = history.traded_stock;
      let action = history.action;
      let actionAmount = history.amount;
      let stockPrice = history.price;
      let avgCost = 0;
      records.push([date, stockCode, action, actionAmount, stockPrice]);

      if (!(stockCode in portfolio)) {
          portfolio[stockCode] = {
              'stock_cnt': 0,
              'total_amt': 0,
              'max_inv_amt': 0,
              'avg_cost': 0,
              'trade_hist': [],
              'profit_hist': [],
              'profit_hist_pct': []
          };
      }
      if ((action == 'buy') || (action == '매수')) {
          portfolio[stockCode]['stock_cnt'] += actionAmount;
          portfolio[stockCode]['total_amt'] += actionAmount * stockPrice;
          if (portfolio[stockCode]['total_amt'] > portfolio[stockCode]['max_inv_amt']) {
              portfolio[stockCode]['max_inv_amt'] = portfolio[stockCode]['total_amt'];
          }
          avgCost = (portfolio[stockCode]['stock_cnt'] == 0) ? 0 : portfolio[stockCode]['total_amt'] / portfolio[stockCode]['stock_cnt'];
          portfolio[stockCode]['avg_cost'] = avgCost;
          portfolio[stockCode]['trade_hist'].push(-1 * actionAmount * stockPrice);
      } else if ((action == 'sell') || (action == '매도')) {
          let profit = (actionAmount * stockPrice) - (actionAmount * portfolio[stockCode]['avg_cost']);
          portfolio[stockCode]['profit_hist'].push(profit);
          portfolio[stockCode]['profit_hist_pct'].push(profit / portfolio[stockCode]['max_inv_amt']);
          totalProfitHist.push(profit);
          totalProfitHistPct.push(profit / portfolio[stockCode]['max_inv_amt'])
          dateList.push(Date.UTC(date.slice(0, 4), date.slice(4, 6), date.slice(6)));
          portfolio[stockCode]['stock_cnt'] -= actionAmount;
          portfolio[stockCode]['total_amt'] -= actionAmount * stockPrice;
          avgCost = (portfolio[stockCode]['stock_cnt'] == 0) ? 0 : portfolio[stockCode]['total_amt'] / portfolio[stockCode]['stock_cnt'];
          portfolio[stockCode]['avg_cost'] = avgCost;
          portfolio[stockCode]['trade_hist'].push(actionAmount * stockPrice);
          if (portfolio[stockCode]['stock_cnt'] == 0) {
              portfolio[stockCode]['total_amt'] = 0;
          }
      }
  }

  totalProfitHist.reduce((prev, curr, i) => { return cumProfitHist[i] = prev + curr; }, 0);
  totalProfitHistPct.reduce((prev, curr, i) => { return yieldCurve[i] = ((i == 0) ? (1 + prev) : prev) * (1 + curr); }, 0);
  chartData = totalProfitHist.map((item, i) => { return [dateList[i], item]; });
  // console.log(returnData);
  // console.log(records);
  // console.log(portfolio);
  // console.log(totalProfitHist);
  // console.log(totalProfitHistPct);
  // console.log(cumProfitHist);
  // console.log(yieldCurve);
  // console.log(chartData);
  return [records, portfolio, totalProfitHist, totalProfitHistPct, cumProfitHist, yieldCurve, chartData];
};

const formRecord = (recordList) => {
  let records = ``;
  for (let record of recordList) {
    if ((record[2] == 'buy') || (record[2] == '매수')) {
      record.push('buy');
    } else if ((record[2] == 'sell') || (record[2] == '매도')) {
      record.push('sell');
    }
    records += formatString(recordHTML, record);
    record.pop();
  }
  return formatString(recordsHTML, [records])
};

window.addEventListener('load', async () => {
  const portHistoryData = await getPortHistoryData();
  drawPortHistoryChart(portHistoryData.slice(-1)[0]);

  const profitP = document.querySelector('.section-header > p');
  profitP.innerHTML = formatString(`수익금: {0} 원`, [Math.floor(portHistoryData.slice(-1)[0].slice(-1)[0][1])])

  const recordsDiv = document.getElementsByClassName('records')[0];
  recordsDiv.innerHTML = formRecord(portHistoryData[0]);

  const csvDownloadBtn = document.getElementsByClassName('download')[0];
  csvDownloadBtn.addEventListener('click', (event) => {
    downloadCSV(portHistoryData[0]);
  });

  const orderBtn = document.getElementById('order');

  orderBtn.addEventListener('click', (event) => {
    recordsDiv.innerHTML = formRecord(portHistoryData[0].reverse());
  });

});