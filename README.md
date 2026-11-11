# Actualidad Eléctrica

Web estática preparada para Netlify Functions y Netlify Blobs.

## Despliegue
1. Importa este repositorio en Netlify.
2. Build command: dejar vacío. Publish directory: `.`
3. En el primer despliegue, ejecuta `refresh-news` desde Netlify para inicializar el histórico.
4. `refresh-news` está programada para ejecutarse cada 30 minutos; `feed` entrega el histórico a la página.

## Fuentes RSS iniciales
- Google News (búsqueda en español)
- BOE (feed general)
- InsideEVs Battery Tech

El histórico se conserva en Netlify Blobs, se deduplica por URL y se limita a las 5.000 entradas más recientes. Las fuentes adicionales se incorporarán cuando se verifiquen sus feeds RSS.

## Nota
El asistente basado en `claude.use("sample")` del Artifact original no funciona en alojamiento externo y debe adaptarse para funcionar fuera de Claude.
