import { useEffect } from "react";
import { useFriendStore } from "../store/useFriendStore";
import { Check, X } from "lucide-react";

const FriendsPage = () => {
  const { friendRequests, getFriendRequests, acceptFriendRequest, rejectFriendRequest } =
    useFriendStore();

  useEffect(() => {
    getFriendRequests();
  }, []);

  return (
    <div className="h-screen pt-20">
      <div className="max-w-2xl mx-auto p-4 py-8">
        <div className="bg-base-300 rounded-xl p-6 space-y-6">
          <h1 className="text-2xl font-semibold">Friend Requests</h1>

          {friendRequests.length === 0 ? (
            <p className="text-zinc-400 text-center py-8">No pending friend requests</p>
          ) : (
            friendRequests.map((user) => (
              <div key={user._id} className="flex items-center justify-between bg-base-200 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <img
                    src={user.profilePic || "/avatar.png"}
                    alt={user.fullName}
                    className="size-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-medium">{user.fullName}</p>
                    <p className="text-sm text-zinc-400">
                      @{user.username || user.email?.split("@")[0]}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => acceptFriendRequest(user._id)}
                    className="btn btn-success btn-sm gap-1"
                  >
                    <Check className="size-4" /> Accept
                  </button>
                  <button
                    onClick={() => rejectFriendRequest(user._id)}
                    className="btn btn-error btn-sm gap-1"
                  >
                    <X className="size-4" /> Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
export default FriendsPage;