import axios from "axios"

export const axiosInstance = axios.create({});

axiosInstance.interceptors.request.use(
    (config)=>{
        const token=localStorage.getItem("token");
        if(token){
            config.headers.Authorization=`Bearer ${token}`;
            console.log("Bearer token Testing",token)
        }
        return config;
    },
    (error)=>{
        return Promise.reject(error);
    }
)
export const apiConnector = (method, url, bodyData, headers = {}, params = {}) => {
    console.log("API Request Headers:", headers);
    return axiosInstance({
        method,
        url,
        data: bodyData || null,
        headers: { ...headers },
        params: params || null,
    });
    
};