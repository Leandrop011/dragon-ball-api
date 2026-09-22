
// ! INTERFACE QUE ESTABLECE COMO CONTRATO EL METODO GET
export interface HttpAdapterInterface{
    get<T>( url: string ): Promise<T>;
}
