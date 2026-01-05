-- Enable RLS on push_subscriptions
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own subscriptions
CREATE POLICY "Users can view own push subscriptions"
    ON push_subscriptions
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own subscriptions
CREATE POLICY "Users can insert own push subscriptions"
    ON push_subscriptions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own subscriptions
CREATE POLICY "Users can update own push subscriptions"
    ON push_subscriptions
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own subscriptions
CREATE POLICY "Users can delete own push subscriptions"
    ON push_subscriptions
    FOR DELETE
    USING (auth.uid() = user_id);

-- Comments
COMMENT ON POLICY "Users can view own push subscriptions" ON push_subscriptions IS 'Users can only view their own push notification subscriptions';
COMMENT ON POLICY "Users can insert own push subscriptions" ON push_subscriptions IS 'Users can only create subscriptions for themselves';
COMMENT ON POLICY "Users can update own push subscriptions" ON push_subscriptions IS 'Users can only update their own subscriptions';
COMMENT ON POLICY "Users can delete own push subscriptions" ON push_subscriptions IS 'Users can only delete their own subscriptions';




