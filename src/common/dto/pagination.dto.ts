import { IsNumber, IsOptional, IsPositive, Min } from "class-validator"

// ! DTO CREADO PARA MANEJAR DATOS DE PAGINACION(QUERY PARAMETERS)
export class PaginationDTO {
    
    @IsOptional()
    @IsPositive()
    @IsNumber()
    @Min(1)
    public limit?: number
    
    @IsOptional()
    @IsPositive()
    @IsNumber()
    public offset?: number

}
