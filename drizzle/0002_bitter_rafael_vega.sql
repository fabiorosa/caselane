CREATE TABLE "rate_limits" (
	"action" varchar(60) NOT NULL,
	"key_hash" varchar(64) NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"count" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "rate_limits_action_key_hash_window_start_pk" PRIMARY KEY("action","key_hash","window_start")
);
