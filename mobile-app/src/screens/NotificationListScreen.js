import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  RefreshControl,
  StatusBar,
} from 'react-native';
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  sendLocalNotification,
} from '../services/notificationService';

export default function NotificationListScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    const list = await fetchNotifications();
    setNotifications(list);
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleMarkAsRead = async (id) => {
    const updated = await markNotificationAsRead(id);
    setNotifications(updated);
  };

  const handleMarkAllRead = async () => {
    const updated = await markAllNotificationsAsRead();
    setNotifications(updated);
  };

  const handleNavigate = (item) => {
    handleMarkAsRead(item.id);
    if (item.route === 'Results') {
      navigation.navigate('Results', {
        exam: { id: item.examId, title: 'Database Systems & MongoDB Indexing' },
        score: 92,
        totalMarks: 100,
      });
    } else {
      navigation.navigate('ExamDetail', {
        exam: { id: item.examId, title: 'Full-Stack MERN Architecture Assessment' },
      });
    }
  };

  const handleSimulatePush = async () => {
    await sendLocalNotification({
      title: '🚨 Exam Schedule Alert',
      message: 'A new assessment "Full-Stack MERN Architecture" has been assigned to your cohort.',
      data: { type: 'warning', examId: 'exam_101', route: 'ExamDetail' },
    });
    loadData();
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filteredList =
    filter === 'unread' ? notifications.filter((n) => !n.read) : notifications;

  const renderIcon = (type) => {
    switch (type) {
      case 'warning':
        return <Text style={styles.icon}>⚠️</Text>;
      case 'success':
        return <Text style={styles.icon}>🏆</Text>;
      default:
        return <Text style={styles.icon}>🛡️</Text>;
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[styles.itemCard, !item.read && styles.itemCardUnread]}
      onPress={() => handleNavigate(item)}
    >
      <View style={[styles.iconBox, !item.read && styles.iconBoxUnread]}>
        {renderIcon(item.type)}
      </View>

      <View style={styles.itemContent}>
        <View style={styles.itemTopRow}>
          <Text
            style={[styles.itemTitle, !item.read && styles.itemTitleUnread]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text style={styles.itemTime}>{item.timestamp}</Text>
        </View>

        <Text style={styles.itemMessage} numberOfLines={2}>
          {item.message}
        </Text>

        <View style={styles.itemFooter}>
          <Text style={styles.actionLink}>View Details →</Text>
          {!item.read && (
            <TouchableOpacity
              onPress={() => handleMarkAsRead(item.id)}
              style={styles.markReadBtn}
            >
              <Text style={styles.markReadText}>Mark read</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header Bar */}
      <View style={styles.header}>
        <View>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Notifications</Text>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{unreadCount} new</Text>
              </View>
            )}
          </View>
          <Text style={styles.subtitle}>Real-time examination alerts and updates</Text>
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAllRead}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, filter === 'all' && styles.tabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.tabText, filter === 'all' && styles.tabTextActive]}>
            All ({notifications.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, filter === 'unread' && styles.tabActive]}
          onPress={() => setFilter('unread')}
        >
          <Text style={[styles.tabText, filter === 'unread' && styles.tabTextActive]}>
            Unread ({unreadCount})
          </Text>
        </TouchableOpacity>

        {/* Simulate Push Notification for Testing */}
        <TouchableOpacity style={styles.simulateBtn} onPress={handleSimulatePush}>
          <Text style={styles.simulateBtnText}>+ Test Push</Text>
        </TouchableOpacity>
      </View>

      {/* Notifications List */}
      <FlatList
        data={filteredList}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#4F46E5']}
            tintColor="#4F46E5"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptySub}>
              You are all caught up! New exam reminders and score alerts will appear here.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  unreadBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  unreadBadgeText: {
    color: '#4F46E5',
    fontSize: 11,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  markAllBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  markAllText: {
    color: '#4F46E5',
    fontSize: 12,
    fontWeight: '700',
  },
  tabContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 8,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  tabActive: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#4F46E5',
    fontWeight: '700',
  },
  simulateBtn: {
    marginLeft: 'auto',
    backgroundColor: '#0D9488',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  simulateBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  itemCardUnread: {
    backgroundColor: '#F8FAFF',
    borderColor: '#C7D2FE',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconBoxUnread: {
    backgroundColor: '#EEF2FF',
  },
  icon: {
    fontSize: 18,
  },
  itemContent: {
    flex: 1,
  },
  itemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
    marginRight: 6,
  },
  itemTitleUnread: {
    color: '#0F172A',
    fontWeight: '800',
  },
  itemTime: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '500',
  },
  itemMessage: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  actionLink: {
    color: '#4F46E5',
    fontSize: 11,
    fontWeight: '700',
  },
  markReadBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  markReadText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4F46E5',
    marginLeft: 8,
    marginTop: 4,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 260,
    lineHeight: 18,
  },
});
