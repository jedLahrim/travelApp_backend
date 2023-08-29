select *
from User_organization where id IN (select O.id from User LEFT JOIN `Order` O on User.id = O.user_id);
#
select *
from Organization where id IN (select userName from User inner join `Order` O on User.id = O.user_id);

select *
from User
inner join `Order` O on User.id = O.user_id
where O.id IN (select promoCode.id from promoCode);
# shorthand
select *
from User
inner join `Order` O on User.id = O.user_id;

INSERT INTO User (userName, gender, email, userType) VALUES ('hello', 'male', 'email', 'admin')