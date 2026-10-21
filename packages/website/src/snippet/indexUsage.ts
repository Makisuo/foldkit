import { Cart, Item } from './domain'
import { Products } from './page'

// Access a feature namespace
Products.Model
Products.ProductsBlock.Message
Products.ProductsBlock.OutMessage

// Access domain modules
Cart.addItem(item)(cart)
Cart.totalItems(cart)
