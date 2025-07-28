// Configuración de la aplicación

const config = {
  // URLs de API
  api: {
    // URL del backend en producción (Render)
    production: "https://backend-milistasuper.onrender.com",
    // URL del backend en desarrollo (local)
    development: "http://localhost:4000",
  },
  
  // Ambiente actual ('production' o 'development')
  // Cambia esta variable para alternar entre entornos
  environment: "production",
  
  // Función para obtener la URL base actual según el ambiente
  getApiBaseUrl: function() {
    return this.api[this.environment];
  }
};

export default config;