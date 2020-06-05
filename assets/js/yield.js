const historyList = [
    ['1', 'buy', 2, 1000],
    ['1', 'buy', 3, 1050],
    ['1', 'sell', 5, 900],
    ['2', 'buy', 2, 2000],
    ['2', 'sell', 1, 2100],
    ['2', 'sell', 1, 2200],
    ['1', 'buy', 2, 1000],
    ['1', 'buy', 3, 1050],
    ['1', 'sell', 5, 900],
    ['2', 'buy', 2, 2000],
    ['2', 'sell', 1, 2100],
    ['2', 'sell', 1, 2200]
]

const portfolio = {};
const totalProfitHist = [];
const totalProfitHistPct = [0];
const cumProfitHist = [];
const yieldCurve = [];
const chartData = [];

for (let history of historyList) {
    let stockCode = history[0];
    let action = history[1];
    let actionAmount = history[2];
    let stockPrice = history[3];
    let avgCost = 0;

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
    if (action == 'buy') {
        portfolio[stockCode]['stock_cnt'] += actionAmount;
        portfolio[stockCode]['total_amt'] += actionAmount * stockPrice;
        if (portfolio[stockCode]['total_amt'] > portfolio[stockCode]['max_inv_amt']) {
            portfolio[stockCode]['max_inv_amt'] = portfolio[stockCode]['total_amt'];
        }
        avgCost = (portfolio[stockCode]['stock_cnt'] == 0) ? 0 : portfolio[stockCode]['total_amt'] / portfolio[stockCode]['stock_cnt'];
        portfolio[stockCode]['avg_cost'] = avgCost;
        portfolio[stockCode]['trade_hist'].push(-1 * actionAmount * stockPrice);
    } else {
        let profit = (actionAmount * stockPrice) - (actionAmount * portfolio[stockCode]['avg_cost']);
        portfolio[stockCode]['profit_hist'].push(profit);
        portfolio[stockCode]['profit_hist_pct'].push(profit / portfolio[stockCode]['max_inv_amt']);
        totalProfitHist.push(profit);
        totalProfitHistPct.push(profit / portfolio[stockCode]['max_inv_amt'])
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

console.log(portfolio);
console.log(totalProfitHist);
console.log(totalProfitHistPct);
console.log(cumProfitHist);
console.log(yieldCurve);