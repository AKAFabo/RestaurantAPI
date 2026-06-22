SELECT
    ul.address AS zona,
    COUNT(o.id) AS total_pedidos,
    SUM(o.total) AS ingresos
FROM user_locations ul
INNER JOIN orders o
    ON ul.user_id = o.user_id
GROUP BY ul.address
ORDER BY total_pedidos DESC;