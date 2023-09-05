

export const serverConfig = async () => {
    const response = await fetch(`/api/config`, {
        method: "get",
        headers: {
            "Content-Type": "application/json",
        },
    });
    if (!response.ok) {
        console.log(response);
        console.log("Server Config: Error happened while fetching data");
        return null;
    }
    const data = await response.json();
    return data;
};


