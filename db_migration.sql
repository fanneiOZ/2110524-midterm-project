create database broadcast owner broadcast_admin;

create table data_enhanced
(
    uuid char(36) not null
        constraint data_enhanced_pk
            primary key,
    author varchar(64),
    message varchar(1024),
    likes bigint default 0,
    active boolean default true,
    timestamp_key char(25) not null
        constraint data_enhanced_timestamp_key_key
            unique
);

alter table data_enhanced owner to broadcast_admin;

create index data_enhanced_active_data
    on data_enhanced (active desc, timestamp_key asc);

create table entity_memento
(
    id char(25) not null
        constraint entity_memento_pk
            primary key,
    entity_id char(36) not null,
    change_type char not null,
    state jsonb
);

alter table entity_memento owner to broadcast_admin;

create index entity_memento_change_type_id_index
    on entity_memento (change_type, id);
