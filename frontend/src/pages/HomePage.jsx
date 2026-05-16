import { useChatStore } from "../store/useChatStore";
import { useGroupStore } from "../store/useGroupStore";

import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";
import GroupContainer from "../components/GroupContainer";

const HomePage = () => {
  const { selectedUser } = useChatStore();
  const { selectedGroup } = useGroupStore();

  const renderMain = () => {
    if (selectedUser) return <ChatContainer />;
    if (selectedGroup) return <GroupContainer />;
    return <NoChatSelected />;
  };

  return (
    <div className="h-screen bg-base-200">
      <div className="flex items-center justify-center md:pt-20 md:px-4 h-full md:h-auto">
        <div className="bg-base-100 w-full h-full md:rounded-lg md:shadow-cl md:max-w-6xl md:h-[calc(100vh-8rem)]">
          <div className="flex h-full md:rounded-lg overflow-hidden">
            <Sidebar />
            {/* flex-1 ensures the main panel fills all space sidebar leaves on mobile */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              {renderMain()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;