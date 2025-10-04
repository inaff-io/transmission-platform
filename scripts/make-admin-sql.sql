update usuarios set categoria = 'admin' where lower(email) = lower('pecosta26@gmail.com');
select id, email, categoria from usuarios where lower(email) = lower('pecosta26@gmail.com');
