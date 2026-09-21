
// ! FUNCION QUE SE ENCARGARA DE OTORGAR UN VALUE A LAS ENVIRONMENTS QUE SE ENCUENTREN VACIAS
export const EnvConfiguration = () => ({
    environment: process.env.NODE_ENV || 'dev',
    dbConnection: process.env.MONGODB,
    port: process.env.PORT || 3001,
})
