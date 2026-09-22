// ! INTERFAZ QUE LA USAREMOS PARA AGREGAR TIPADO ESTRICTO
export interface DragonBallResponse {
    items: Item[];
}

export interface Item {
    id:          number;
    name:        string;
    ki:          string;
}
