import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, TextInput, FlatList, StyleSheet, Alert, TouchableOpacity, Image } from 'react-native';
import { db } from '../firebaseConfig';
import { StatusBar } from 'expo-status-bar';
import { collection, addDoc, getDocs, updateDoc, doc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

export default function App() {
  const [product, setProduct] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [inventory, setInventory] = useState([]);
  const [sales, setSales] = useState([]);
  const [activeTab, setActiveTab] = useState('inventory');

  const productsRef = collection(db, 'products');
  const salesRef = collection(db, 'sales');

  useEffect(() => {
    const unsubscribe = onSnapshot(productsRef, snapshot => {
      const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInventory(products);
    });

    const unsubscribeSales = onSnapshot(salesRef, snapshot => {
      const salesList = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        date: doc.data().date ? new Date(doc.data().date) : new Date() 
      }));
      setSales(salesList.sort((a, b) => b.date - a.date));
    });

    return () => {
      unsubscribe();
      unsubscribeSales();
    };
  }, []);

  const addProduct = async () => {
    if (!product || !quantity || !price) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const querySnapshot = await getDocs(productsRef);
    const existingProduct = querySnapshot.docs.find(doc => doc.data().name.toLowerCase() === product.toLowerCase());

    if (existingProduct) {
      const productRef = doc(db, 'products', existingProduct.id);
      const newQuantity = existingProduct.data().quantity + parseInt(quantity);
      const newPrice = price !== existingProduct.data().price.toString() ? parseFloat(price) : existingProduct.data().price;
      await updateDoc(productRef, {
        quantity: newQuantity,
        price: newPrice,
      });
      Alert.alert('Product Updated', `Quantity of ${product} updated to ${newQuantity}.`);
    } else {
      await addDoc(productsRef, {
        name: product,
        quantity: parseInt(quantity),
        price: parseFloat(price),
      });
      Alert.alert('Product Added', `${product} added to inventory.`);
    }

    setProduct('');
    setQuantity('');
    setPrice('');
  };

  const sellProduct = async (item) => {
    if (item.quantity <= 0) {
      Alert.alert('Insufficient stock', 'This product is out of stock');
      return;
    }

    Alert.alert(
      'Confirm Sale',
      `Sell 1 ${item.name} for $${item.price.toFixed(2)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          onPress: async () => {
            const productRef = doc(db, 'products', item.id);
            await updateDoc(productRef, {
              quantity: item.quantity - 1
            });

            await addDoc(salesRef, {
              name: item.name,
              price: item.price,
              date: new Date().toISOString()
            });
          }
        }
      ]
    );
  };

  const deleteItem = async (id, type) => {
    Alert.alert(
      'Confirm Deletion',
      `Are you sure you want to delete this ${type}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            if (type === 'product') {
              await deleteDoc(doc(db, 'products', id));
            } else {
              await deleteDoc(doc(db, 'sales', id));
            }
          }
        }
      ]
    );
  };

  const renderInventoryItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <Text style={styles.productName}>{item.name}</Text>
        <View style={styles.productDetails}>
          <Text style={styles.productDetail}>Qty: {item.quantity}</Text>
          <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.sellButton]} 
          onPress={() => sellProduct(item)}
          disabled={item.quantity <= 0}
        >
          <Ionicons name="cart" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]} 
          onPress={() => deleteItem(item.id, 'product')}
        >
          <Ionicons name="trash" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSaleItem = ({ item }) => (
    <View style={styles.saleCard}>
      <Ionicons name="receipt" size={24} color="#09FF11FF" style={styles.saleIcon} />
      <View style={styles.saleInfo}>
        <Text style={styles.saleProduct}>{item.name}</Text>
        <Text style={styles.saleDate}>
          {item.date.toLocaleDateString()} at {item.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
        </Text>
      </View>
      <View style={styles.saleActions}>
        <Text style={styles.salePrice}>${item.price.toFixed(2)}</Text>
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton, styles.saleDeleteButton]} 
          onPress={() => deleteItem(item.id, 'sale')}
        >
          <Ionicons name="trash" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
    <StatusBar style="light" backgroundColor='#EB0000FF'/>
      <View style={styles.header}>
        <Image source={require('../assets/icon.png')} style={styles.icon}/>
        <Text style={styles.title}>Vani Dog Inventory</Text>
      </View>
      <View style={styles.formContainer}>
        <Text style={styles.sectionTitle}>Add Product</Text>
        <TextInput
          placeholder="Product Name"
          placeholderTextColor="#999"
          value={product}
          onChangeText={setProduct}
          style={styles.input}
        />
        <View style={styles.row}>
          <TextInput
            placeholder="Quantity"
            placeholderTextColor="#999"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
            style={[styles.input, styles.halfInput]}
          />
          <TextInput
            placeholder="Price"
            placeholderTextColor="#999"
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
            style={[styles.input, styles.halfInput]}
          />
        </View>
        <TouchableOpacity style={styles.addButton} onPress={addProduct}>
          <Text style={styles.addButtonText}>Add Product</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'inventory' && styles.activeTab]}
          onPress={() => setActiveTab('inventory')}
        >
          <Text style={[styles.tabText, activeTab === 'inventory' && styles.activeTabText]}>Inventory</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'sales' && styles.activeTab]}
          onPress={() => setActiveTab('sales')}
        >
          <Text style={[styles.tabText, activeTab === 'sales' && styles.activeTabText]}>Sales ({sales.length})</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'inventory' ? (
        <FlatList
          data={inventory}
          keyExtractor={item => item.id}
          renderItem={renderInventoryItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No products in inventory</Text>
          }
        />
      ) : (
        <FlatList
          data={sales}
          keyExtractor={item => item.id}
          renderItem={renderSaleItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No sales recorded</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFFFF',
  },
  icon: {
    width: 50,
    height: 50,
  },
  header: {
    backgroundColor: '#EB0000FF',
    paddingVertical: 15,
    paddingHorizontal: 16,
    elevation: 5,
    flexDirection: 'row',
    gap: 30,
    justifyContent: 'flex-start',
    alignItems: 'center'
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
  },
  formContainer: {
    padding: 16,
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,    marginBottom: 20,

  },
  input: {
    backgroundColor: '#F8F9FA',
    padding: 14,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    color: '#333',
  },
  halfInput: {
    flex: 1,
    marginHorizontal: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#D32F2F',
  },
  tabText: {
    color: '#666',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#D32F2F',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 1,
  },
  cardContent: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  productDetails: {
    flexDirection: 'row',
  },
  productDetail: {
    fontSize: 14,
    color: '#666',
    marginRight: 12,
  },
  productPrice: {
    fontSize: 14,
    color: '#D32F2F',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    marginLeft: 10,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sellButton: {
    backgroundColor: '#4CAF50',
  },
  deleteButton: {
    backgroundColor: '#B71C1C',
  },
  saleCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
  },
  saleIcon: {
    marginRight: 12,
    color: '#D32F2F',
  },
  saleInfo: {
    flex: 1,
  },
  saleProduct: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  saleDate: {
    fontSize: 12,
    color: '#999',
  },
  saleActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  salePrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D32F2F',
    marginRight: 12,
  },
  saleDeleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#B71C1C',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 24,
    fontSize: 16,
  },
});