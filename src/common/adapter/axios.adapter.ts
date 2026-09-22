import axios, { AxiosInstance } from "axios";
import { HttpAdapterInterface } from "../interfaces/http-adapter.interface";
import { Injectable } from "@nestjs/common";

// ! PATRON ADAPTADOR PARA REALIZAR PETICIONES HTTP CON AXIOS
@Injectable()
export class AxiosAdapter implements HttpAdapterInterface{
    
    // ? instance of axios
    private axios: AxiosInstance = axios;

    // ? implementamos una interface que tiene este metodo por contrato
    async get<T>(url: string): Promise<T> {
        try {
            // ? realizamos la peticion http get y desestructuramos la data
            const { data } = await this.axios.get<T>( url )
            // ? retornamos la data
            return data;
        } catch (error: any) {
            // ? posible error
            throw new Error(`This is an error - check logs.`)
        }
    }

}
