SELECT 
    DATE_TRUNC('month', o.created_at) AS mes,
    p.category AS categoria,
    SUM(oi.quantity * oi.price) AS ingresos_totales,
    COUNT(DISTINCT o.id) AS cantidad_pedidos
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON p.id = oi.product_id
GROUP BY mes, p.category
ORDER BY mes, ingresos_totales DESC;