<x-app-layout>
    <main class="container py-4">
        <div class="border border-secondary border-opacity-25 rounded-0 mw-100">
            <div class="row align-items-stretch p-4">
                <!-- Thumbnails -->
                <div class="col-12 col-sm-3 col-xl-2 d-flex flex-row flex-sm-column justify-content-between gap-4 thumbnail-container">
                    @php
                        $secondaryImages = $product->images->where('is_main', false)->take(3);
                    @endphp
                    @foreach ($secondaryImages as $image)
                        <div class="flex-fill">
                            <img
                                class="img-fluid bg-light thumbnail"
                                src="{{ asset('storage/' . $image->path) }}"
                                alt="{{ $image->title }}"
                                data-large="{{ asset('storage/' . $image->path) }}"
                                data-bs-toggle="modal"
                                data-bs-target="#imageModal"
                            />
                        </div>
                    @endforeach
                </div>

                <!-- Main Image -->
                <div class="col-12 col-sm-9 col-xl-6 mt-4 mt-sm-0 main-image-container">
                    @if ($product->mainImage)
                        <img
                            class="img-fluid bg-light thumbnail"
                            id="mainImage"
                            src="{{ asset('storage/' . $product->mainImage->path) }}"
                            alt="{{ $product->title }}"
                            data-large="{{ asset('storage/' . $product->mainImage->path) }}"
                            data-bs-toggle="modal"
                            data-bs-target="#imageModal"
                        />
                    @else
                        <img
                            class="img-fluid bg-light thumbnail"
                            id="mainImage"
                            src="{{ asset('images/placeholder.png') }}"
                            alt="No image"
                            data-large="{{ asset('images/placeholder.png') }}"
                            data-bs-toggle="modal"
                            data-bs-target="#imageModal"
                        />
                    @endif
                </div>

                <!-- Product Info -->
                <div class="col-12 col-xl-4 mt-4 mt-xl-0 d-flex">
                    <div class="d-flex flex-column gap-4 gap-sm-5 w-100 bg-light p-4">
                        <div>
                            <h5 class="fw-bold fs-2 text-secondary mb-2">{{ $product->title }}</h5>
                            <span class="fs-1 fw-bold">{{ number_format($product->price, 2) }}€</span>
                        </div>
                        <div class="d-flex flex-column gap-4 gap-sm-2">
                            <div class="d-flex justify-content-between flex-column flex-sm-row">
                                <span class="text-secondary fw-bold">Typ produktu</span>
                                <span>{{ $product->category->name }}</span>
                            </div>
                            <div class="d-flex justify-content-between flex-column flex-sm-row">
                                <span class="text-secondary fw-bold">Farba</span>
                                <span>{{ $product->color->name }}</span>
                            </div>
                            <div class="d-flex justify-content-between flex-column flex-sm-row">
                                <span class="text-secondary fw-bold">Materiál</span>
                                <span>{{ $product->material->name }}</span>
                            </div>
                            <div class="d-flex justify-content-between flex-column flex-sm-row">
                                <span class="text-secondary fw-bold">Umiestnenie</span>
                                <span>{{ $product->placement->name }}</span>
                            </div>
                            <div class="d-flex justify-content-between flex-column flex-sm-row">
                                <span class="text-secondary fw-bold">Rozmery Š-D-H (cm)</span>
                                <span>{{ $product->width }}-{{ $product->length }}-{{ $product->depth }}</span>
                            </div>
                        </div>

                        <!-- Add to Cart Form -->
                        <form action="{{ route('cart.add') }}" method="POST">
                            @csrf
                            <input type="hidden" name="product_id" value="{{ $product->id }}">
                            <div class="d-flex justify-content-between gap-3">
                                <input
                                    type="number"
                                    name="quantity"
                                    value="1"
                                    min="1"
                                    max="{{ $product->in_stock }}"
                                    class="form-control w-25 px-2"
                                />
                                <button type="submit" class="btn btn-primary w-75">
                                    <i class="bi bi-cart-fill"></i> Pridať do košíka
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>

        <!-- Image Modal -->
        <div class="modal fade" id="imageModal" tabindex="-1" aria-labelledby="imageModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-md modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <img id="modalImage" class="img-fluid" src="" alt="Large product image" />
                    </div>
                </div>
            </div>
        </div>

        <!-- Description -->
        <div class="border border-secondary border-opacity-25 rounded-0 my-4 p-4">
            <h2 class="mb-3">Popis</h2>
            <p class="mb-0">{{ $product->description }}</p>
        </div>

        <!-- Related Products -->
        <section>
            <h1 class="m-0">Súvisiace produkty</h1>
            <div id="relatedProductsCarouselLg" class="carousel slide d-none d-lg-block" data-bs-ride="carousel">
                <div class="carousel-inner">
                    @foreach($relatedProducts->chunk(4) as $chunkIndex => $chunk)
                        <div class="carousel-item @if($chunkIndex === 0) active @endif">
                            <div class="row row-cols-4 g-3 my-4 justify-content-center">
                                @foreach($chunk as $product)
                                    <div class="col d-flex justify-content-center m-0">
                                        <div class="card p-3 px-5 px-sm-3 border border-secondary border-opacity-25 rounded-0">
                                            <div class="bg-light rounded">
                                                <img 
                                                    src="{{ asset('storage/' . ($product->mainImage->path ?? 'images/placeholder.jpg')) }}"
                                                    class="img-fluid"
                                                    alt="{{ $product->title }}"
                                                />
                                            </div>
                                            <div class="card-body px-0">
                                                <h5 class="card-title fw-bold fs-6 text-secondary mb-2">
                                                    {{ $product->title }}
                                                </h5>
                                                <div class="d-flex justify-content-between align-items-center">
                                                    <span class="fs-5 fw-bold">{{ number_format($product->price, 2) }}€</span>
                                                    <a href="{{ route('products.show', $product->id) }}" class="btn btn-outline-primary btn-sm d-flex align-items-center">
                                                        <i class="bi bi-bag-fill me-2"></i> Kúpiť
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                @endforeach
                            </div>
                        </div>
                    @endforeach
                </div>
            </div>
        
            <div id="relatedProductsCarouselMd" class="carousel slide d-none d-md-block d-lg-none" data-bs-ride="carousel">
                <div class="carousel-inner">
                    @foreach($relatedProducts->chunk(3) as $chunkIndex => $chunk)
                        <div class="carousel-item @if($chunkIndex === 0) active @endif">
                            <div class="row row-cols-3 g-3 my-4 justify-content-center m-0">
                                @foreach($chunk as $product)
                                    <div class="col d-flex justify-content-center">
                                        <div class="card p-3 px-5 px-sm-3 border border-secondary border-opacity-25 rounded-0">
                                            <div class="bg-light rounded">
                                                <img 
                                                    src="{{ asset('storage/' . ($product->mainImage->path ?? 'images/placeholder.jpg')) }}"
                                                    class="img-fluid"
                                                    alt="{{ $product->title }}"
                                                />
                                            </div>
                                            <div class="card-body px-0">
                                                <h5 class="card-title fw-bold fs-6 text-secondary mb-2">
                                                    {{ $product->title }}
                                                </h5>
                                                <div class="d-flex justify-content-between align-items-center">
                                                    <span class="fs-5 fw-bold">{{ number_format($product->price, 2) }}€</span>
                                                    <a href="{{ route('products.show', $product->id) }}" class="btn btn-outline-primary btn-sm d-flex align-items-center">
                                                        <i class="bi bi-bag-fill me-2"></i> Kúpiť
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                @endforeach
                            </div>
                        </div>
                    @endforeach
                </div>
            </div>

            <div id="relatedProductsCarouselSm" class="carousel slide d-block d-md-none" data-bs-ride="carousel">
                <div class="carousel-inner">
                    @foreach($relatedProducts->chunk(1) as $chunkIndex => $chunk)
                        <div class="carousel-item @if($chunkIndex === 0) active @endif">
                            <div class="row row-cols-1 g-3 my-4 justify-content-center">
                                @foreach($chunk as $product)
                                    <div class="col d-flex justify-content-center m-0">
                                        <div class="card p-3 px-5 px-sm-3 border border-secondary border-opacity-25 rounded-0">
                                            <div class="bg-light rounded">
                                                <img 
                                                    src="{{ asset('storage/' . ($product->mainImage->path ?? 'images/placeholder.jpg')) }}"
                                                    class="img-fluid"
                                                    alt="{{ $product->title }}"
                                                />
                                            </div>
                                            <div class="card-body px-0">
                                                <h5 class="card-title fw-bold fs-6 text-secondary mb-2">
                                                    {{ $product->title }}
                                                </h5>
                                                <div class="d-flex justify-content-between align-items-center">
                                                    <span class="fs-5 fw-bold">{{ number_format($product->price, 2) }}€</span>
                                                    <a href="{{ route('products.show', $product->id) }}" class="btn btn-outline-primary btn-sm d-flex align-items-center">
                                                        <i class="bi bi-bag-fill me-2"></i> Kúpiť
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                @endforeach
                            </div>
                        </div>
                    @endforeach
                </div>
            </div>
        </section>
    </main>

    <!-- JavaScript for Image Modal -->
    <script>
        document.addEventListener('DOMContentLoaded', function () {
            const thumbnails = document.querySelectorAll('.thumbnail');
            const modalImage = document.getElementById('modalImage');

            thumbnails.forEach(thumbnail => {
                thumbnail.addEventListener('click', function () {
                    modalImage.src = this.dataset.large;
                });
            });
        });
    </script>
</x-app-layout>