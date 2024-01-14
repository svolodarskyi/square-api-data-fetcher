
require('dotenv').config()

//TODO: use OAuth
const pat = process.env.SQUARE_PAT

const locationId = 'LZ0HMKRHF3BE3'
const pageLimit = '2'
const baseApiUrl = 'https://connect.squareupsandbox.com/v2';


//declare headers - which will be same for all 
const headerObj = new Headers();
headerObj.append("Square-Version", "2023-12-13");
headerObj.append("Authorization", `Bearer ${pat}`);
headerObj.append("Content-Type", "application/json");

const options = {
    method: "GET",
    headers: headerObj,
};

const fetchPayments = async (cursor = null) => {
    try {

      const url = `${baseApiUrl}/payments?limit=${pageLimit}&location_id=${locationId}`;
      // Change request url if cursor (link to the next page of the endpoint) exists
      const requestUrl = cursor ? `${url}&cursor=${cursor}` : url;
  
      const requesObj = new Request(requestUrl);
      const res = await fetch(requesObj, options);
      const data = await res.json();
  
      console.log(data);
  
      if ('cursor' in data) {
        // If there is a cursor, make the next fetch recursively
        await fetchPayments(cursor = data['cursor']);
      }
    } catch (err) {
      console.log(err);
    }
  };
  
fetchPayments();
  