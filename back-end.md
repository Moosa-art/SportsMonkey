Here's a plain-English breakdown of everything the backend does:

🔐 Authentication (/api/auth)
Handles user accounts and login sessions.

Register — creates a new account with email + password (password is encrypted with bcrypt, never stored as plain text)
Login — checks credentials, returns a token your app uses to prove who you are
Token system — uses two tokens: a short 15-minute access token + a 7-day refresh cookie, so users stay logged in without re-entering passwords
Logout — destroys the session

Supports 3 account types: regular user, player, team admin

📰 Feed (/api/feed)
Powers the home screen post feed.

Returns posts in order, newest first
Supports tabs: All, Following (posts from people you follow), Trending (most liked/commented in 48hrs), Favourite
Cursor pagination — loads 20 posts at a time, fetch more as you scroll
Marks which posts you've already liked if you're logged in


❤️ Likes (/api/social/like)
Handles the heart button on posts and comments.

Like or unlike any post or comment
Count updates instantly in real-time to everyone viewing that post via Socket.io
Prevents duplicate likes (can't like twice)


💬 Comments (/api/social/comments)
Handles the comment section on every post.

Load comments for a post (paginated)
Post a new comment
Reply to a comment (threaded replies via parent_id)
Delete your own comment
New comments broadcast live to everyone viewing the same post
Notifies the post author when someone comments


👥 Follows (/api/social/follow)
Powers the Follow/Following buttons you see on ProfilePage.

Follow or unfollow a user, player, or team
Get a list of who follows someone
Get a list of who someone follows
Sends a notification to the person when they get a new follower


🚩 Reports (/api/social/report)
The report content system for moderation.

Report a post, comment, or user
Reasons: spam, hate speech, misinformation, harassment, violence, nudity, other
Prevents reporting the same thing twice
Reports go into a database queue for admin review


🔔 Notifications (/api/social/notifications)
The notification bell system.

Stores notifications when: someone likes your post, comments on your post, or follows you
Returns your last 50 notifications
Mark all as read
Delivered in real-time via Socket.io to your device instantly


👤 Profiles (/api/profiles)
Powers the Profile Page and player discovery grid.

Your own profile: post count, followers count, following count, favourite club
Update your bio, avatar, display name
Public profiles for any user by username
Discover players grid — the exact list shown in ProfilePage with follow status
Individual player profiles and team profiles


⚽ Football Data (/api/fixtures, /api/table, /api/live)
Powers the Fixtures, Table, and Live pages — these already worked in the UI with dummy data, now they read from a real database.

Fixtures — full year of matches grouped by month
Table — Premier League or Championship standings
Live — all matches for any given date, grouped by league


⚡ Real-time Sync (Socket.io)
This is what makes the app feel live without refreshing.
EventWhat it doesLike a postEveryone viewing that post sees the count change instantlyNew commentEveryone on that post sees it appear immediatelyNew followerYou get notified the second someone follows youLive score updateScore changes appear on LivePage in real-timeNew postFeed subscribers see new posts appear automatically

🗄️ Database (MySQL)
Stores everything in 11 tables:
users · players · teams · posts · likes · comments · follows · reports · notifications · fixtures · league_table
Like/comment counts on posts stay accurate automatically using MySQL triggers — no extra code needed every time someone likes something.