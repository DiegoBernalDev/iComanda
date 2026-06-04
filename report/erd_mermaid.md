# ERD iComanda en Mermaid

Copia este bloque en Mermaid Live Editor, Excalidraw, draw.io o una herramienta compatible. Exporta la imagen como PNG y reemplaza `report/img/erd_database.png`.

```mermaid
erDiagram
    AUTH_USERS ||--|| PROFILES : "id"
    PROFILES ||--o{ RESTAURANTS : "owner_id"
    RESTAURANTS ||--o{ TABLES : "restaurant_id"
    RESTAURANTS ||--o{ MENU_ITEMS : "restaurant_id"
    RESTAURANTS ||--o{ ORDERS : "restaurant_id"
    RESTAURANTS ||--o{ EXPENSES : "restaurant_id"
    RESTAURANTS ||--o{ TABLE_CALLS : "restaurant_id"
    RESTAURANTS ||--o{ MATERIALS : "restaurant_id"
    RESTAURANTS ||--o{ MATERIAL_STOCK_MOVEMENTS : "restaurant_id"
    PROFILES ||--o{ ORDERS : "mesero_id"
    PROFILES ||--o{ EXPENSES : "created_by"
    PROFILES ||--o{ MATERIAL_STOCK_MOVEMENTS : "created_by"
    TABLES ||--o{ ORDERS : "table_id"
    TABLES ||--o{ TABLE_CALLS : "table_id"
    ORDERS ||--o{ ORDER_ITEMS : "order_id"
    MENU_ITEMS ||--o{ ORDER_ITEMS : "menu_item_id"
    MATERIALS ||--o{ MATERIAL_STOCK_MOVEMENTS : "material_id"

    AUTH_USERS {
        uuid id PK
        text email
    }

    PROFILES {
        uuid id PK
        text nombre
        text email
        rol_usuario rol
        boolean activo
        timestamptz created_at
    }

    RESTAURANTS {
        uuid id PK
        text nombre
        text slug UK
        text direccion
        text telefono
        text logo_url
        uuid owner_id FK
        timestamptz created_at
    }

    TABLES {
        uuid id PK
        uuid restaurant_id FK
        integer numero
        integer capacidad
        boolean activa
        timestamptz last_cleared_at
        timestamptz created_at
    }

    MENU_ITEMS {
        uuid id PK
        uuid restaurant_id FK
        text nombre
        text descripcion
        numeric precio
        text categoria
        text imagen_url
        boolean disponible
        boolean agotado
        timestamptz created_at
    }

    ORDERS {
        uuid id PK
        uuid restaurant_id FK
        uuid table_id FK
        uuid mesero_id FK
        estado_orden estado
        metodo_pago metodo_pago
        boolean pago_confirmado
        timestamptz paid_at
        numeric total
        timestamptz created_at
        timestamptz closed_at
    }

    ORDER_ITEMS {
        uuid id PK
        uuid order_id FK
        uuid menu_item_id FK
        text nombre
        numeric precio_unitario
        integer cantidad
        timestamptz created_at
    }

    EXPENSES {
        uuid id PK
        uuid restaurant_id FK
        text descripcion
        numeric monto
        date fecha
        uuid created_by FK
        timestamptz created_at
    }

    TABLE_CALLS {
        uuid id PK
        uuid table_id FK
        uuid restaurant_id FK
        boolean atendida
        timestamptz atendida_at
        timestamptz created_at
    }

    MATERIALS {
        uuid id PK
        uuid restaurant_id FK
        text nombre
        text unidad
        numeric stock_minimo
        boolean activo
        timestamptz created_at
    }

    MATERIAL_STOCK_MOVEMENTS {
        uuid id PK
        uuid material_id FK
        uuid restaurant_id FK
        material_movement_type movement_type
        numeric quantity
        text reason
        text notes
        uuid created_by FK
        timestamptz created_at
    }
```

## Enums

- `rol_usuario`: `mesero`, `admin`, `chef`
- `estado_orden`: `activa`, `lista`, `entregada`, `cancelada`
- `metodo_pago`: `efectivo`, `qr`, `tarjeta`
- `material_movement_type`: `consumo`, `reposicion`
