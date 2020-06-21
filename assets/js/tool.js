import '../css/tool.css';
import Axios from 'axios';
import Highcharts from 'highcharts/highstock';
import Exporting from 'highcharts/modules/exporting';

Exporting(Highcharts);

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
      inputEnabled: false,
      buttonTheme: { visibility: 'hidden', },
      labelStyle: { visibility: 'hidden', },
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

///// Constant Variables /////
const TOKEN = getCookie('PP-PAGE-TOKEN');
const ID = getCookie('PP-PAGE-ID');
const MONITORSTOCKURL = 'https://api.peepeespace.com/quant/monitorstock/';
const PORTHISTORYURL = 'https://api.peepeespace.com/quant/porthistory/';
const CODELISTURL = 'http://api.blended.kr/codelist/all';
const STOCKDATAURL = 'http://api.blended.kr/adj_close/{0}';
const OPTIONS = {
  headers: {'Authorization': `Token ${TOKEN}`}
};

class TagData {

  constructor() {
    this.nextCodeListOption = 1;
    this.codeList = [];
    this.today = '';
    this.currentCodeListJSON = {};
    this.currentCodeListDate = '';
    this.currentCodeListItems = [];
  }

  async setup() { 
    let today = new Date().toISOString().slice(0,10);
    today = today.replace('-', '').replace('-', '');
    this.today = today;
    await this.setCodelist();
    await this.setCodeListItemsFromDB();
  }

  async setCodelist() {
    const res = await Axios.get(CODELISTURL);
    this.codeList = res.data;
  }

  async setCodeListItemsFromDB() {
    const userSpecificURL = formatString(`{0}?user={1}`, [MONITORSTOCKURL, ID])
    const getRes = await Axios.get(userSpecificURL, OPTIONS);
    this.currentCodeListJSON = getRes.data.results.pop();
    if (typeof this.currentCodeListJSON != 'undefined') {
      this.setDate(this.currentCodeListJSON['date']);
      let returnData = this.currentCodeListJSON['codelist'].split(',');
      this.currentCodeListItems = returnData.map((code) => {
        let stockName = this.getName(code);
        return `${code}|${stockName}`;
      })
    }
  };

  getName(code) {
    let filtered = this.codeList.filter(info => info.includes(code));
    if (filtered.length != 0) {
      return filtered[0].split('|')[1];
    } else {
      return '';
    }
  }

  getCode(name) {
    let filtered = this.codeList.filter(info => info.split('|')[1].trim() == name.trim());
    if (filtered.length != 0) {
      return filtered[0].split('|')[0];
    } else {
      return '';
    }
  }

  setDate(date) {
    this.currentCodeListDate = date;
  }

  getDate() {
    return this.currentCodeListDate;
  }

  addCode(code) {
    code = code.trim();
    let filtered = this.currentCodeListItems.filter(info => info.includes(code));
    if (filtered.length == 0) {
      const stockName = this.getName(code);
      this.currentCodeListItems.push(`${code}|${stockName}`);
      return stockName;
    } else {
      return '';
    }
  }

  addName(name) {
    let filtered = this.currentCodeListItems.filter(info => info.includes(name));
    if (filtered.length == 0) {
      const code = this.getCode(name);
      this.currentCodeListItems.push(`${code}|${name}`);
      return code;
    } else {
      return '';
    }
  }

  removeCode(code) {
    code = code.trim();
    this.currentCodeListItems = this.currentCodeListItems.filter(info => !info.includes(code));
  }

  removeName(name) {
    this.currentCodeListItems = this.currentCodeListItems.filter(info => !info.includes(name));
  }

  async updateCodeListData() {
    try {
      const dataID = this.currentCodeListJSON['id'];
      const dataSpecificURL = `${MONITORSTOCKURL}${dataID}/`;
      const jsonData = this.currentCodeListJSON;
      delete jsonData['created'];
      delete jsonData['updated'];
      jsonData['date'] = this.today;
      if (this.currentCodeListItems.length != 0) {
        jsonData['codelist'] = this.currentCodeListItems.map(info => info.split('|')[0]).join();
        await Axios.put(dataSpecificURL, jsonData, OPTIONS);
      } else {
        await Axios.delete(dataSpecificURL, OPTIONS);
      }
    } catch {
      // pass
    }
  }

  async postCodeListData() {
    let params = {
      'date': this.today,
      'codelist': this.currentCodeListItems.map(info => info.split('|')[0]).join(),
      'user': ID
    };
    await Axios.post(MONITORSTOCKURL, params, OPTIONS);
  }

};

let toolState;
let formSectionOpen = 0;
const formSection = document.getElementById('form-section');
const actionBtns = document.getElementsByClassName('action-btn');
const monitorstocksSection = document.getElementById('monitorstocks');

const formHTML = `
<form>
  <input id="code-list" type="text" name="code-list" placeholder="코드나 종목명으로 등록" />
  <input type="submit" value="등록">
</form>
{0}
`;

const formErrorHTML = `<p>코드는 000000의 형식입니다! 다시 확인해주세요.</p>`;

const noTextFormErrorHTML = `<p>코드나 종목명을 확인해주세요.</p>`;

const monitorstocksHTML = `
<div class="monitorstocks-tag">
  <h2>
    {0} 관심종목 🧑‍💻
    <span class="name-change">{2}</span>
  </h2>
  {1}
  <p>잘못된 종목이 있다면 다시 담아주기 바랍니다.</p>
</div>
`;

const tagHTML = `
<div class="tag">
  {0}
  <span class="delete-tag">삭제</span>
</div>
`;

const initTagBehaviors = (TagDataInstance) => {
  const nameChangeBtn = document.getElementsByClassName('name-change')[0];

  nameChangeBtn.addEventListener('click', (event) => {
    reformatTagSection(TagDataInstance.nextCodeListOption, TagDataInstance);
    TagDataInstance.nextCodeListOption += 1;
  });

  const deleteTagBtns = document.getElementsByClassName('delete-tag');
  
  for (let btn of deleteTagBtns) {
    btn.addEventListener('click', async (event) => {
      let codeName = btn.parentNode.innerText.split('\n')[0];
      if (nameChangeBtn.innerText == '코드보기') {
        TagDataInstance.removeName(codeName);
      } else {
        TagDataInstance.removeCode(codeName);
      }
      await TagDataInstance.updateCodeListData();
      await TagDataInstance.setCodeListItemsFromDB();
      await formatTagSection(TagDataInstance);
    });
  }
};

const formatTagSection = async (TagDataInstance) => {
  let rawDate = TagDataInstance.currentCodeListDate;
  let rawCodeList = TagDataInstance.currentCodeListItems;

  let tagsHTML = '';
  if (rawCodeList.length != 0) {
    for (let code of rawCodeList) {
      let stockName = code.split('|')[1];
      tagsHTML += formatString(tagHTML, [stockName]);
    }
  } else {
    tagsHTML += formatString(tagHTML, ['-']);
  }

  const monitorstocksTagHTML = formatString(monitorstocksHTML, [rawDate, tagsHTML, '코드보기']);
  monitorstocksSection.innerHTML = monitorstocksTagHTML;

  initTagBehaviors(TagDataInstance);
};

const reformatTagSection = (type, TagDataInstance) => {
  let tagsHTML = '';
  let btnText = '';
  for (let info of TagDataInstance.currentCodeListItems) {
    let code = info.split('|')[0];
    let stockName = info.split('|')[1];
    if (type % 2 == 1) {
      tagsHTML += formatString(tagHTML, [code]);
      btnText = '이름보기';
    } else if (type % 2 == 0) {
      tagsHTML += formatString(tagHTML, [stockName]);
      btnText = '코드보기';
    }
  }
  if (TagDataInstance.currentCodeListItems.length == 0) {
    tagsHTML += formatString(tagHTML, ['-']);
    btnText = '코드보기';
  }

  const monitorstocksTagHTML = formatString(monitorstocksHTML, [
    TagDataInstance.currentCodeListDate,
    tagsHTML,
    btnText
  ]);
  monitorstocksSection.innerHTML = monitorstocksTagHTML;

  initTagBehaviors(TagDataInstance);
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
          portfolio[stockCode]['total_amt'] -= actionAmount * portfolio[stockCode]['avg_cost'];
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
  chartData = cumProfitHist.map((item, i) => { return [dateList[i], item]; });
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



window.addEventListener('load', async () => {

  const TagDataInstance = new TagData();
  await TagDataInstance.setup();

  // prepare page on page load
  if (typeof TagDataInstance.currentCodeListItems != 'undefined') {
    await formatTagSection(TagDataInstance);
  }

  for (let i = 0 ; i < actionBtns.length; i++) {
    actionBtns[i].addEventListener('click', (e) => {
      let btnText = actionBtns[i].innerText;
      if (btnText == '툴시작') {
        let toolStateArea = document.getElementById('want-state');
        toolState = toolStateArea.innerText;
        if (toolState != '1') {
          toolStateArea.innerText = '1';
        } else {
          toolStateArea.innerText = '0';
        }
      } else {
        if (formSectionOpen == 0) {
          formSection.innerHTML = formatString(formHTML, ['']);
          let codeListInput = document.getElementById('code-list');
          codeListInput.focus();
          formSectionOpen = 1;
        } else {
          formSection.innerHTML = '';
          formSectionOpen = 0;
        }
      }
    });
  }

  formSection.addEventListener('submit', async (e) => {
    e.preventDefault();

    let errorExists = 0;
    
    let codeListInput = document.getElementById('code-list');
    let rawCode = codeListInput.value;
    codeListInput.value = '';
    if (rawCode == '') {
      errorExists = 1;
      formSection.innerHTML = formatString(formHTML, [noTextFormErrorHTML]);
      codeListInput = document.getElementById('code-list');
      codeListInput.focus();
    } else {
      let trimCode = rawCode.trim();
      if ((trimCode.length != 6) || (isNaN(Number(trimCode)))) {
        let code = TagDataInstance.getCode(rawCode);
        if (code == '') {
          errorExists = 1;
          formSection.innerHTML = formatString(formHTML, [noTextFormErrorHTML]);
          codeListInput = document.getElementById('code-list');
          codeListInput.focus();
        } else {
          TagDataInstance.addCode(code);
          formSection.innerHTML = formatString(formHTML, ['']);
          codeListInput = document.getElementById('code-list');
          codeListInput.focus();
        }
      } else {
        let name = TagDataInstance.getName(trimCode);
        if (name == '') {
          errorExists = 1;
          formSection.innerHTML = formatString(formHTML, [noTextFormErrorHTML]);
          codeListInput = document.getElementById('code-list');
          codeListInput.focus();
        } else {
          TagDataInstance.addName(name);
          formSection.innerHTML = formatString(formHTML, ['']);
          codeListInput = document.getElementById('code-list');
          codeListInput.focus();
        }
      }
    }
    if (errorExists == 0) {
      if (typeof TagDataInstance.currentCodeListJSON != 'undefined') {
        await TagDataInstance.updateCodeListData();
      } else {
        await TagDataInstance.postCodeListData();
      }
      await TagDataInstance.setCodeListItemsFromDB();
      await formatTagSection(TagDataInstance);
    }
  });

  const portHistoryData = await getPortHistoryData();
  drawPortHistoryChart(portHistoryData.slice(-1)[0]);

});