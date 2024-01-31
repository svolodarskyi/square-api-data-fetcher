const getOrderIds = async () => {
    try {
      let pmts = await parsePayments();
      // Filter is applied to remove any falsy values (like null or undefined)
      let orderIds = pmts.map((pmt) => pmt.order_id).filter((orderId) => typeof orderId !== 'undefined'); 
      return orderIds
    } catch (err) {
      console.log(err);
    }
  };
  
  
  
  const getOrders = async (config, allOrdersLineItems = []) => {
    try {
      let orderIds = await getOrderIds();
  
      // Set the batch size (adjust as needed)
      const batchSize = 40;
  
      // Process orders in batches
      for (let i = 0; i < orderIds.length; i += batchSize) {
        const batchOrderIds = orderIds.slice(i, i + batchSize);
  
        // Parallelize API Requests for the current batch
        const orderRequests = batchOrderIds.map(async (orderId) => {
          try {
            const requestUrl = `${config.baseApiUrl}/orders/${orderId}`;
            const requestObj = new Request(requestUrl, {
              method: "GET",
              headers: config.headerObj,
            });
  
  
            // Introduce a pause between requests (e.g., 500 milliseconds)
            await new Promise((resolve) => setTimeout(resolve, 2000));
  
            const res = await fetch(requestObj);
  
            if (!res.ok) {
              console.error(`Failed to fetch order ${orderId}. Status: ${res.status}`);
              return null;
            }
  
            return res.json();
          } catch (error) {
            console.error(`Error fetching order ${orderId}:`, error);
            return null;
          }
        });
  
        const orderResponses = await Promise.all(orderRequests);
  
        // Optimize Line Item Mapping
        for (let j = 0; j < batchOrderIds.length; j++) {
          const orderResponse = orderResponses[j];
  
          if (!orderResponse) {
            // Skip processing if the response is null (indicating an error during fetching)
            continue;
          }
  
          const { id, created_at, source } = orderResponse.order;
          const lineItems = orderResponse.order.line_items.map((item) => ({
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
            item_type: item?.item_type ?? null,
          }));
  
          allOrdersLineItems.push(...lineItems);
        }
      }
    } catch (err) {
      console.error('Error in getOrders:', err);
    }
    console.log('finished');
  };
  
  
  
  
  //getOrders(config, []);