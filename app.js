const { create } = require('domain');

require('dotenv').config()

const config = {
  locationId: process.env.LOCATION_ID,
  pageLimit: 1000,
  baseApiUrl: 'https://connect.squareup.com/v2',
  headerObj: new Headers({
    "Square-Version": "2024-01-18",
    "Authorization": `Bearer ${process.env.SQUARE_PAT}`,
    "Content-Type": "application/json",
  }),
  startTime: new Date('2022-12-31T00:00:00.000-07:00').toISOString(),
  endTime: new Date('2024-01-01T21:00:00.000-07:00').toISOString(),
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
      status: pmt?.status ?? null,
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

const parseLineItems = async(orders) => {
  let allLineItems = []
  for (let i = 0; i < orders.length; i++) {
    const order = orders[i];
    const { id, created_at, source } = order;
    if(order.line_items) {
      const lineItems = order.line_items.map((item) => ({
        id,
        created_at,
        source: source?.name ?? null,
        uid: item.uid,
        catalog_object_id: item?.catalog_object_id ?? null,
        catalog_version: item?.catalog_version ?? null,
        quantity: item?.quantity ?? null,
        name: item?.name ?? null,
        currency: item?.base_price_money?.currency ?? null,
        base_price_money: item?.base_price_money?.amount / 100 ?? null,
        gross_sales_money: item?.gross_sales_money?.amount / 100 ?? null,
        total_discount_money: item?.total_discount_money?.amount / 100 ?? null,
        total_money: item?.total_money?.amount / 100 ?? null,
        state: item?.state ?? null,
        item_type: item?.item_type ?? null,
      }));
      allLineItems.push(...lineItems);
  }
  }
  return allLineItems
}

const fetchOrders = async (cursor = null, allOrdersLineItems = [], config) => {
  try {
    const requestUrl = `${config.baseApiUrl}/orders/search`;
    const requestBody = {
        location_ids: [
          config.locationId
        ],
        return_entries: false,
        query: {
          filter: {
            date_time_filter: {
              created_at: {
                end_at: config.endTime,
                start_at: config.startTime
              }
            }
          }
        },
        limit: config.pageLimit
      }
      
    if (cursor !== null) {
      requestBody.cursor = cursor;
    }

    const requestObj = new Request(requestUrl, {
      method: "POST",
      headers: config.headerObj,
      body: JSON.stringify(requestBody)
    });
    const res = await fetch(requestObj);
    
    if (!res.ok) {
      let errorData = await res.json()
      const errorMessage = `Failed to fetch orders. Status: ${res.status}, Error Details: ${parseErrorDetails(errorData)}`;
      console.error(errorMessage);
      throw new Error(errorMessage);
    }

    responseData = await res.json();

    
    //const lineItems = await parseLineItems(responseData.orders)
    allOrdersLineItems.push(...responseData.orders);

    if ('cursor' in responseData) {
      const nextOrders = await fetchOrders(responseData.cursor, allOrdersLineItems, config);
      return nextOrders;
    } else {
      // If there is no more cursor, return or process the accumulated data
      return allOrdersLineItems;
    }
  } catch (err) {
    console.log(err);
  }
};

// Helper function to parse error details
const parseErrorDetails = (errorData) => {
  if (errorData.errors && errorData.errors.length > 0) {
    return errorData.errors.map(error => error.detail).join(', ');
  } else {
    return 'Unknown error';
  }
};

fetchOrders(null, [], config)

//parse returns from orders

