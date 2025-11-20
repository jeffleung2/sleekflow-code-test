import { useState, useEffect } from 'react';
import { Plus, ListTodo, LogOut, Settings, Menu, X } from 'lucide-react';
import { TodoList } from './components/TodoList';
import { TodoForm } from './components/TodoForm';
import { TodoListSelector } from './components/TodoListSelector';
import { TodoListManager } from './components/TodoListManager';
import { ActivityFeed } from './components/ActivityFeed';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthPage } from './components/AuthPage';
import { useAuth } from './context/AuthContext';
import { useTodoStore } from './store/todoStore';

function App() {
  const [showForm, setShowForm] = useState(false);
  const [showListManager, setShowListManager] = useState(false);
  const [listManagerMode, setListManagerMode] = useState<'create' | 'edit'>('create');
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showMobileActivity, setShowMobileActivity] = useState(false);
  const { user, logout } = useAuth();
  
  const {
    lists,
    selectedListId,
    fetchLists,
    selectList,
    createList,
    updateList,
    deleteList,
    shareList,
    getSelectedList,
    canEdit,
  } = useTodoStore();

  const selectedList = getSelectedList();

  // Debug logging
  useEffect(() => {
    console.log('App - lists:', lists);
    console.log('App - selectedListId:', selectedListId);
    console.log('App - selectedList:', selectedList);
  }, [lists, selectedListId, selectedList]);

  // Fetch lists on mount
  useEffect(() => {
    console.log('App mounted, fetching lists...');
    fetchLists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateList = () => {
    setListManagerMode('create');
    setShowListManager(true);
  };

  const handleEditList = () => {
    if (selectedList) {
      setListManagerMode('edit');
      setShowListManager(true);
    }
  };

  return (
    <ProtectedRoute fallback={<AuthPage />}>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b sticky top-0 z-40">
          <div className="max-w-full mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Mobile Menu Button */}
                <button
                  onClick={() => setShowMobileSidebar(!showMobileSidebar)}
                  className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
                >
                  {showMobileSidebar ? <X size={24} /> : <Menu size={24} />}
                </button>
                
                <div className="p-1.5 sm:p-2 bg-blue-600 rounded-lg">
                  <ListTodo size={20} className="text-white sm:hidden" />
                  <ListTodo size={28} className="text-white hidden sm:block" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-2xl font-bold text-gray-900">
                    <span className="hidden sm:inline">TODO Manager</span>
                    <span className="sm:hidden">TODO</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">
                    {selectedList ? selectedList.name : 'Multi-user task management'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-4">
                {/* User Info */}
                {user && (
                  <div className="flex items-center gap-1 sm:gap-2">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-xs sm:text-sm">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-gray-700 hidden md:block">
                      {user.full_name || user.username}
                    </span>
                  </div>
                )}

                {/* Add Todo Button */}
                {selectedList && canEdit() && (
                  <button
                    onClick={() => setShowForm(true)}
                    className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                  >
                    <Plus size={18} className="sm:hidden" />
                    <Plus size={20} className="hidden sm:block" />
                    <span className="hidden sm:inline">New TODO</span>
                  </button>
                )}

                {/* Manage List Button */}
                {selectedList && (
                  <button
                    onClick={handleEditList}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition hidden sm:block"
                    title="Manage List"
                  >
                    <Settings size={20} />
                  </button>
                )}

                {/* Logout Button */}
                <button
                  onClick={logout}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
                  title="Logout"
                >
                  <LogOut size={18} className="sm:hidden" />
                  <LogOut size={20} className="hidden sm:block" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Sidebar - List Selector (Desktop + Mobile Overlay) */}
          <div className={`
            fixed lg:static inset-0 z-30 lg:z-auto
            ${showMobileSidebar ? 'block' : 'hidden lg:block'}
          `}>
            {/* Mobile Overlay */}
            <div 
              className="lg:hidden absolute inset-0 bg-black bg-opacity-50"
              onClick={() => setShowMobileSidebar(false)}
            />
            
            {/* Sidebar Content */}
            <div className="relative lg:relative h-full">
              <TodoListSelector
                lists={lists || []}
                selectedListId={selectedListId}
                onSelectList={(id) => {
                  selectList(id);
                  setShowMobileSidebar(false);
                }}
                onCreateList={() => {
                  handleCreateList();
                  setShowMobileSidebar(false);
                }}
                currentUserId={user?.id || 0}
              />
            </div>
          </div>

          {/* Main Todo List Area */}
          <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
            {selectedList ? (
              <div className="max-w-7xl mx-auto">
                {/* Mobile: Stack vertically */}
                <div className="lg:hidden space-y-4">
                  <TodoList />
                  
                  {/* Mobile Activity Feed Toggle */}
                  <button
                    onClick={() => setShowMobileActivity(!showMobileActivity)}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-left font-medium text-gray-700 hover:bg-gray-50 transition"
                  >
                    {showMobileActivity ? 'Hide' : 'Show'} Activity Feed
                  </button>
                  
                  {showMobileActivity && <ActivityFeed />}
                </div>
                
                {/* Desktop: Side by side */}
                <div className="hidden lg:grid lg:grid-cols-3 gap-6">
                  {/* Todo List - Takes 2 columns on large screens */}
                  <div className="lg:col-span-2">
                    <TodoList />
                  </div>
                  
                  {/* Activity Feed - Takes 1 column on large screens */}
                  <div className="lg:col-span-1">
                    <ActivityFeed />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center p-4">
                  <ListTodo size={48} className="mx-auto text-gray-300 mb-4 sm:w-16 sm:h-16" />
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                    No List Selected
                  </h2>
                  <p className="text-sm sm:text-base text-gray-500 mb-6">
                    Select a list from the sidebar or create a new one to get started
                  </p>
                  <button
                    onClick={handleCreateList}
                    className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm sm:text-base"
                  >
                    <Plus size={18} className="sm:hidden" />
                    <Plus size={20} className="hidden sm:block" />
                    Create Your First List
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>

        {/* Todo Form Modal */}
        {showForm && <TodoForm onClose={() => setShowForm(false)} />}

        {/* List Manager Modal */}
        {showListManager && (
          <TodoListManager
            list={listManagerMode === 'edit' ? selectedList : null}
            onClose={() => setShowListManager(false)}
            onCreate={createList}
            onUpdate={updateList}
            onDelete={deleteList}
            onShare={shareList}
            currentUserId={user?.id || 0}
            mode={listManagerMode}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}

export default App;
