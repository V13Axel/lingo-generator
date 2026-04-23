import Alpine from 'alpinejs';
import persist from '@alpinejs/persist';
import { lingoApp } from './app.js';
import './styles.css';

Alpine.plugin(persist);
// Register the component. Use the factory form (function, not arrow) so
// Alpine can bind `this` to the component proxy when evaluating the
// returned object's property initializers — this is what makes
// `this.$persist(...)` work inside the factory's return literal.
Alpine.data('lingoApp', lingoApp);

Alpine.start();
