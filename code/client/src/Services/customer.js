

const metaData = ({type, date, time})=>{
    return{
        type,
        date,
        time
    }
}
export const createCustomer = async ({ learnerEmail, learnerName,metadata }) => {


    const response = await fetch('/lessons', {
        method: "post",
        headers: {
            'Accept': 'application/json',
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ learnerEmail, learnerName, metadata: metaData(metadata) })
    });
    if (!response.ok) {
        console.log(response);
        console.log("Create customer: Error happened while fetching data");
        return null;
    }
    const data = await response.json();
    return data;
};

