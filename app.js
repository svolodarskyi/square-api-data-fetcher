
require('dotenv').config()

const config = {
  locationId: process.env.LOCATION_ID,
  pageLimit: '100',
  baseApiUrl: 'https://connect.squareup.com/v2',
  headerObj: new Headers({
    "Square-Version": "2024-01-18",
    "Authorization": `Bearer ${process.env.SQUARE_PAT}`,
    "Content-Type": "application/json",
  }),
  startTime: new Date('2023-07-24T00:00:00.000-07:00').toISOString(),
  endTime: new Date('2024-01-24T21:00:00.000-07:00').toISOString(),
};


const fetchPayments = async (cursor = null, allPayments = [], config) => {
  try {
    const url = `${config.baseApiUrl}/payments?limit=${config.pageLimit}&begin_time=${config.startTime}&end_time=${config.endTime}`;

    // Change request url if cursor (link to the next page of the endpoint) exists
    const requestUrl = cursor ? `${url}&cursor=${cursor}` : url;
    const requestObj = new Request(requestUrl, {
      method: "GET",
      headers: config.headerObj, // Fix the header reference here
    });
    const res = await fetch(requestObj);
    const responseData = await res.json();
    allPayments.push(...responseData.payments);

    if ('cursor' in responseData) {
      const nextPayments = await fetchPayments(responseData.cursor, allPayments, config);
      return nextPayments;
    } else {
      // If there is no more cursor, return or process the accumulated data
      return allPayments;
    }
  } catch (err) {
    console.log(err);
  }
};

const parsePayments = async () => {
  try {
    let pmts = await fetchPayments(null, [], config);
    return pmts.map((pmt) => ({
      created_at: pmt?.created_at ?? null,
      updated_at: pmt?.updated_at ?? null,
      amount_money: pmt?.amount_money?.amount ? pmt.amount_money.amount / 100 : null,
      source_type: pmt?.source_type ?? null,
      currency: pmt?.amount_money?.currency ?? null,
      processing_fee: pmt?.processing_fee?.[0]?.amount_money?.amount / 100 ?? null,
      order_id: pmt?.order_id ?? null,
      total_money: pmt?.total_money?.amount / 100 ?? null,
      approved_money: pmt?.approved_money?.amount / 100 ?? null,
    }));
  } catch (err) {
    console.log(err);
  }
};


const getOrderIds = async () => {
  try {
    let pmts = await parsePayments();
    // Filter is applied to remove any falsy values (like null or undefined)
    let orderIds = pmts.map((pmt) => pmt.order_id).filter((orderId) => orderId); 
    console.log(orderIds);
  } catch (err) {
    console.log(err);
  }
};

getOrderIds()




