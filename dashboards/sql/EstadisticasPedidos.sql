SELECT
    status,
    COUNT(*) AS total_pedidos
FROM orders
WHERE status IN ('COMPLETED', 'CANCELLED')
GROUP BY status
ORDER BY total_pedidos DESC;