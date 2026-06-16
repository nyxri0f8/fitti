import { products } from '../data/products';
import ProductCard from './ProductCard';
import ScrollReveal, { StaggerContainer, StaggerItem } from './ScrollReveal';

export default function ProductShowcase({ onAddProduct }) {
  return (
    <section className="section" id="products">
      <div className="container">
        <ScrollReveal>
          <div className="section-header">
            <div className="eyebrow" style={{ display: 'inline-flex' }}>
              <span className="eyebrow-dot"></span>
              The Menu
            </div>
            <h2>Built For <span className="text-green">Performance</span></h2>
            <p>
              High-protein breakfasts designed for busy mornings.
              Real food. Real fuel. No compromise.
            </p>
          </div>
        </ScrollReveal>

        <StaggerContainer className="grid-4" stagger={0.12}>
          {products.map((product, index) => (
            <StaggerItem key={product.id}>
              <ProductCard
                product={product}
                index={index}
                onAdd={onAddProduct}
              />
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
