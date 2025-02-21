import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { Modal } from 'bootstrap';

// 這裡import不要加''不然會變成字串顯示
const BASE_URL =  import.meta.env.VITE_BASE_URL;
const API_PATH = import.meta.env.VITE_API_PATH;

// 輸入框狀態的初始值，全為空白
const defaultModalState = {
  imageUrl: "",
  title: "",
  category: "",
  unit: "",
  origin_price: "",
  price: "",
  description: "",
  content: "",
  is_enabled: 0,
  imagesUrl: [""]
};

function App() {
  // axios取得資料後，狀態的改變
  const [products, setProducts] = useState([]);
  // 驗證是否登入，狀態是否發生變化，初始值是false
  const [isAuth, setIsAuth] = useState(false)
  const [account, setAccount] = useState({
    username:'',
    password:''
  });

  // 帳號輸入後改變的方法
  const handleInputChange = (e) => {
    const { value, name } = e.target
    setAccount({
      ...account,
      [name]: value
    })
  }

  const handleLogin = (e) => {
    e.preventDefault()
    axios.post(`${BASE_URL}/v2/admin/signin`, account)
      // .then((res) => console.log(res)) 用來驗證
      // 當登入成功，狀態轉為true
      .then((res) => {
        // 把token與到期日從資料中解構出來
        const { token, expired } = res.data;
        // console.log(token, expired) 確認是否成功存取
        // 存取在cookie中
        document.cookie = `chunToken=${token}; expires=${new Date(expired).toUTCString()}`;
        axios.defaults.headers.common['Authorization'] = token;
        setIsAuth(true)
        getProducts();
      })
      .catch((error) => alert('登入失敗'))
  }

  const getProducts = async() => {
    try {
      const res = await axios.get(`${BASE_URL}/v2/api/${API_PATH}/admin/products`);
      setProducts(res.data.products);
      // console.log(res.data.products); 用作確認內容
    } catch (error) {
      throw error
    }
  }

  // 檢查是否登入
  const checkLogin = async() => {
    try {
      const res = await axios.post(`${BASE_URL}/v2/api/user/check`);
      getProducts();
      setIsAuth(true);

    } catch (error) {
      console.log(error)
    }
  }
  // 初始化後才檢查是否登入，取得、夾帶token
  useEffect (() => {
    const token = document.cookie.replace(
      /(?:(?:^|.*;\s*)chunToken\s*\=\s*([^;]*).*$)|^.*$/,"$1",);
      // console.log(token);  確認是否有存取成功
      axios.defaults.headers.common['Authorization'] = token;
    checkLogin();
  }, [])

  // 用useRef選定DOM元素，並把Ref加入下方的渲染畫面中
  const productModalRef = useRef(null);
  // 選擇刪除Modal的useRef
  const delProductModalRef = useRef(null);
  // 點選後跳出Modal畫面，需要確認是編輯還是新增頁面
  const [ modalMode, setModalMode ] = useState(null);


  // 畫面渲染後才選取Modal的DOM元素
  useEffect (() => {
    // console.log(productModalRef.current) 確認是否有取得此DOM元素
    // 取消點擊Modal黑色區塊即可以關掉Modal的方法
    new Modal(productModalRef.current, {
      backdrop: false,
    })
    new Modal(delProductModalRef.current, {
      backdrop: false,
    })
    // 可以確認此Modal內的詳細方法
    Modal.getInstance(productModalRef.current)
    // console.log(Modal.getInstance(productModalRef.current))
  }, [])
  
  // 點擊按鈕開啟Modal的方法，再加入參數以確認是編輯還是新增
  const handleProductModalOpen = (mode, product) => {
    const imagesUrl = Array.isArray(product?.imagesUrl) ? product.imagesUrl : [product?.imagesUrl];
    setModalMode(mode);
    // 先判斷是新增還是編輯
    switch (mode) {
      case 'create':
        setTempProduct(defaultModalState);
        break;
      case 'edit':
        setTempProduct({
          ...product,
          imagesUrl
        });
        break;
      default:
        break;
    }
    
    const modalInstance = Modal.getInstance(productModalRef.current);
    modalInstance.show();
  }

  // 點擊叉叉或取消關閉Modal的方法
  const handleProductModalClose = () => {
    const modalInstance = Modal.getInstance(productModalRef.current);
    modalInstance.hide();
  }

  // 刪除Modal
  const handleDelProductModalOpen = (product) => {
    setTempProduct(product)
    const modalInstance = Modal.getInstance(delProductModalRef.current);
    modalInstance.show();
  }
  const handleDelProductModalClose = () => {
    const modalInstance = Modal.getInstance(delProductModalRef.current);
    modalInstance.hide();
  }

  
  // 把input對應到的方法與值加入
  // 輸入值，狀態才有所變化
  const [tempProduct, setTempProduct] = useState(defaultModalState);

  // Modal框框內容輸入改變的方法
  const handleModalInputChange = (e) => {
    const { name, value, checked, type } = e.target;
    // 有的是輸入值、有的是勾選checkbox
    setTempProduct({
      ...tempProduct,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  // 新增圖片的方法
  const handleAddImage = () => {
    const newImages = [...tempProduct.imagesUrl, ''];

    setTempProduct({
      ...tempProduct,
      imagesUrl: newImages
    })
  }

  // 取消圖片的方法
  const handleRemoveImage = () => {
    const newImages = [...tempProduct.imagesUrl];
    // 移除陣列最後一個值
    newImages.pop()
    setTempProduct({
      ...tempProduct,
      imagesUrl: newImages
    })
  }

  // 新增產品的API
  const createProduct = async () => {
    try {
      // 呼叫的API連結與要代入的資料
      const res = await axios.post(`${BASE_URL}/v2/api/${API_PATH}/admin/product`, {
        data: {
          ...tempProduct,
          origin_price: Number(tempProduct.origin_price),
          price: Number(tempProduct.price),
          is_enabled: tempProduct.is_enabled ? 1 : 0
        }
      })
      console.log(res.data.data)
    } catch (error) {
      alert('新增產品失敗')
    }
  }

  // 先看是建立新商品還是編輯商品點選確認之後，會呼叫新增產品的API，並重新取得所有資料，並關閉Modal
  const handleUpdateProduct = async() => {
    const apiCall = modalMode === 'create' ? createProduct : updateProduct
    try {
      await apiCall();
      getProducts();
      handleProductModalClose();
    } catch (error) {
      alert('更新產品失敗')
    }
  }

  // 編輯資料
  const updateProduct = async () => {
    try {
      // 呼叫的API連結與要代入的資料
      const res = await axios.put(`${BASE_URL}/v2/api/${API_PATH}/admin/product/${tempProduct.id}`, {
        data: {
          ...tempProduct,
          origin_price: Number(tempProduct.origin_price),
          price: Number(tempProduct.price),
          is_enabled: tempProduct.is_enabled ? 1 : 0
        }
      })
      console.log(res.data.data)
    } catch (error) {
      alert('新增產品失敗')
    }
  }

  // 刪除資料API
  const delProduct = async () => {
    try {
      // 呼叫的API連結與要代入的資料
      const res = await axios.delete(`${BASE_URL}/v2/api/${API_PATH}/admin/product/${tempProduct.id}`)
      console.log(res.data.data)
    } catch (error) {
      alert('刪除產品失敗')
    }
  }

  // 刪除資料方法
  const handleDelProduct = async() => {
    try {
      await delProduct();
      getProducts();
      handleDelProductModalClose();
    }catch (error) {
      alert('刪除產品失敗')
    }
  }

  return (
    <>
      {
        isAuth ? (<div className="container">
          <div className="row">
              <div className="col">
                <div className="d-flex justify-content-between">
                  <h2>產品列表</h2>
                  <button onClick={() => handleProductModalOpen('create')} type="button" className="btn btn-primary">建立新的產品</button>
                </div>
                <table className="table">
                    <thead>
                      <tr>
                        <th scope="col">產品名稱</th>
                        <th scope="col">原價</th>
                        <th scope="col">售價</th>
                        <th scope="col">是否啟用</th>
                        <th scope="col"></th>
                      </tr>
                    </thead>
                    <tbody>
                        {products.map((item)=> {
                            return <tr key={item.id}>
                              <th scope="row">{item.title}</th>
                              <td>{item.origin_price}</td>
                              <td>{item.price}</td>
                              <td>{item.is_enabled ? (<span className="text-success">啟用</span>) : <span>未啟用</span> }</td>
                              <td>
                                <div className="btn-group">
                                  <button onClick={() => handleProductModalOpen('edit', item)} type="button" className="btn btn-outline-primary btn-sm">編輯</button>
                                  <button onClick={() => handleDelProductModalOpen(item)} type="button" className="btn btn-outline-danger btn-sm">刪除</button>
                                </div>
                              </td>
                            </tr>
                        })}
                    </tbody>
                </table>
              </div>
          </div>
      </div>) : <div className="d-flex flex-column justify-content-center align-items-center vh-100">
          <h1 className="mb-5">請先登入</h1>
          <form onSubmit={handleLogin} className="d-flex flex-column gap-3">
            <div className="form-floating mb-3">
              <input name="username" value={account.username} onChange={handleInputChange} type="email" className="form-control" id="username" placeholder="name@example.com" />
              <label htmlFor="username">Email address</label>
            </div>
            <div className="form-floating">
              <input name="password" value={account.password} onChange={handleInputChange} type="password" className="form-control" id="password" placeholder="Password" />
              <label htmlFor="password">Password</label>
            </div>
            <button className="btn btn-primary">登入</button>
          </form>
          <p className="mt-5 mb-3 text-muted">&copy; 2024~∞ - 六角學院</p>
        </div>
      }
      {
        <div ref={productModalRef} className="modal fade" tabIndex="-1" aria-hidden="true" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
        <div className="modal-dialog modal-dialog-centered modal-xl">
          <div className="modal-content border-0 shadow">
            <div className="modal-header border-bottom">
              <h5 className="modal-title fs-4">{modalMode === 'create' ? '新增產品' : '編輯產品'}</h5>
              <button onClick={handleProductModalClose} type="button" className="btn-close" aria-label="Close"></button>
            </div>
      
            <div className="modal-body p-4">
              <div className="row g-4">
                <div className="col-md-4">
                  <div className="mb-4">
                    <label htmlFor="primary-image" className="form-label">
                      主圖
                    </label>
                    <div className="input-group">
                      <input
                        value={tempProduct.imageUrl}
                        onChange={handleModalInputChange}
                        name="imageUrl"
                        type="text"
                        id="primary-image"
                        className="form-control"
                        placeholder="請輸入圖片連結"
                      />
                    </div>
                    <img
                      src={tempProduct.imageUrl}
                      alt={tempProduct.title}
                      className="img-fluid"
                    />
                  </div>
      
                  {/* 副圖 */}
                  <div className="border border-2 border-dashed rounded-3 p-3">
                    {tempProduct.imagesUrl?.map((image, index) => (
                      <div key={index} className="mb-2">
                        <label
                          htmlFor={`imagesUrl-${index + 1}`}
                          className="form-label"
                        >
                          副圖 {index + 1}
                        </label>
                        <input
                          id={`imagesUrl-${index + 1}`}
                          type="text"
                          placeholder={`圖片網址 ${index + 1}`}
                          className="form-control mb-2"
                        />
                        {image && (
                          <img
                            src={image}
                            alt={`副圖 ${index + 1}`}
                            className="img-fluid mb-2"
                          />
                        )}
                      </div>
                    ))}
                    <div className="btn-group w-100">
                      {/*當圖片未超過5張和最後一個欄位有值就顯示新增按鈕
                      imagesUrl.length < 5 && 
                      tempProduct.imagesUrl[tempProduct.imagesUrl.length - 1] !== '' && 
                      (<button className="btn btn-outline-primary btn-sm w-100">新增圖片</button>)*/}
                      <button onClick={handleAddImage} className="btn btn-outline-primary btn-sm w-100">新增圖片</button>
                      {/*顯示取消按鈕的時機：非唯一的時候就顯示
                      tempProduct.imagesUrl.length > 1 && (
                      <button className="btn btn-outline-danger btn-sm w-100">取消圖片</button>) */}
                      <button onClick={handleRemoveImage} className="btn btn-outline-danger btn-sm w-100">取消圖片</button>
                    </div>
                  </div>
                </div>
      
                <div className="col-md-8">
                  <div className="mb-3">
                    <label htmlFor="title" className="form-label">
                      標題
                    </label>
                    <input
                      value={tempProduct.title}
                      onChange={handleModalInputChange}
                      name="title"
                      id="title"
                      type="text"
                      className="form-control"
                      placeholder="請輸入標題"
                    />
                  </div>
      
                  <div className="mb-3">
                    <label htmlFor="category" className="form-label">
                      分類
                    </label>
                    <input
                      value={tempProduct.category}
                      onChange={handleModalInputChange}
                      name="category"
                      id="category"
                      type="text"
                      className="form-control"
                      placeholder="請輸入分類"
                    />
                  </div>
      
                  <div className="mb-3">
                    <label htmlFor="unit" className="form-label">
                      單位
                    </label>
                    <input
                      value={tempProduct.unit}
                      onChange={handleModalInputChange}
                      name="unit"
                      id="unit"
                      type="text"
                      className="form-control"
                      placeholder="請輸入單位"
                    />
                  </div>
      
                  <div className="row g-3 mb-3">
                    <div className="col-6">
                      <label htmlFor="origin_price" className="form-label">
                        原價
                      </label>
                      <input
                        value={tempProduct.origin_price}
                        onChange={handleModalInputChange}
                        name="origin_price"
                        id="origin_price"
                        type="number"
                        className="form-control"
                        placeholder="請輸入原價"
                      />
                    </div>
                    <div className="col-6">
                      <label htmlFor="price" className="form-label">
                        售價
                      </label>
                      <input
                        value={tempProduct.price}
                        onChange={handleModalInputChange}
                        name="price"
                        id="price"
                        type="number"
                        className="form-control"
                        placeholder="請輸入售價"
                      />
                    </div>
                  </div>
      
                  <div className="mb-3">
                    <label htmlFor="description" className="form-label">
                      產品描述
                    </label>
                    <textarea
                      value={tempProduct.description}
                      onChange={handleModalInputChange}
                      name="description"
                      id="description"
                      className="form-control"
                      rows={4}
                      placeholder="請輸入產品描述"
                    ></textarea>
                  </div>
      
                  <div className="mb-3">
                    <label htmlFor="content" className="form-label">
                      說明內容
                    </label>
                    <textarea
                      value={tempProduct.content}
                      onChange={handleModalInputChange}
                      name="content"
                      id="content"
                      className="form-control"
                      rows={4}
                      placeholder="請輸入說明內容"
                    ></textarea>
                  </div>
      
                  <div className="form-check">
                    <input
                      checked={tempProduct.is_enabled}
                      onChange={handleModalInputChange}
                      name="is_enabled"
                      type="checkbox"
                      className="form-check-input"
                      id="isEnabled"
                    />
                    <label className="form-check-label" htmlFor="isEnabled">
                      是否啟用
                    </label>
                  </div>
                </div>
              </div>
            </div>
      
            <div className="modal-footer border-top bg-light">
              <button onClick={handleProductModalClose} type="button" className="btn btn-secondary">
                取消
              </button>
              <button onClick={handleUpdateProduct} type="button" className="btn btn-primary">
                確認
              </button>
            </div>
          </div>
        </div>
      </div>
      }
      {
        <div
        ref={delProductModalRef}
        className="modal fade"
        id="delProductModal"
        tabIndex="-1"
        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h1 className="modal-title fs-5">刪除產品</h1>
                <button
                  onClick={handleDelProductModalClose}
                  type="button"
                  className="btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                你是否要刪除 
                <span className="text-danger fw-bold">{tempProduct.title}</span>
              </div>
              <div className="modal-footer">
                <button
                  onClick={handleDelProductModalClose}
                  type="button"
                  className="btn btn-secondary"
                >
                  取消
                </button>
                <button onClick={handleDelProduct} type="button" className="btn btn-danger">
                  刪除
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </>
  )
}

export default App
