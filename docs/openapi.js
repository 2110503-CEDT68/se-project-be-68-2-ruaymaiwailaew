const openApiSpec = {
    openapi: '3.0.3',
    info: {
        title: 'Dentist Booking API',
        version: '1.0.0',
        description: 'API documentation for Dentist Booking backend.'
    },
    servers: [
        {
            url: process.env.SWAGGER_BASE_URL,
            description: 'This api server'
        }
    ],
    tags: [
        { name: 'Auth' },
        { name: 'Bookings' },
        { name: 'Dentists' },
        { name: 'Reviews' }
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT'
            },
            cookieAuth: {
                type: 'apiKey',
                in: 'cookie',
                name: 'token'
            }
        },
        schemas: {
            User: {
                type: 'object',
                properties: {
                    _id: { type: 'string' },
                    name: { type: 'string' },
                    telephone: { type: 'string', example: '0812345678' },
                    email: { type: 'string', format: 'email' },
                    role: { type: 'string', enum: ['user', 'admin', 'dentist'] },
                    yearsOfExperience: { type: 'number', nullable: true },
                    areaOfExpertise: { type: 'string', nullable: true },
                    createdAt: { type: 'string', format: 'date-time' }
                }
            },
            Booking: {
                type: 'object',
                properties: {
                    _id: { type: 'string' },
                    bookingDate: { type: 'string', format: 'date-time' },
                    user: {
                        oneOf: [
                            { type: 'string' },
                            {
                                type: 'object',
                                properties: {
                                    _id: { type: 'string' },
                                    name: { type: 'string' },
                                    email: { type: 'string', format: 'email' }
                                }
                            }
                        ]
                    },
                    dentist: {
                        oneOf: [
                            { type: 'string' },
                            {
                                type: 'object',
                                properties: {
                                    _id: { type: 'string' },
                                    name: { type: 'string' },
                                    yearsOfExperience: { type: 'number' },
                                    areaOfExpertise: { type: 'string' }
                                }
                            }
                        ]
                    },
                    createdAt: { type: 'string', format: 'date-time' }
                }
            },
            Review: {
                type: 'object',
                properties: {
                    _id: { type: 'string' },
                    rating: { type: 'number', minimum: 1, maximum: 5 },
                    comment: { type: 'string', maxLength: 500 },
                    dentist: {
                        oneOf: [
                            { type: 'string' },
                            {
                                type: 'object',
                                properties: {
                                    _id: { type: 'string' },
                                    name: { type: 'string' }
                                }
                            }
                        ]
                    },
                    user: {
                        oneOf: [
                            { type: 'string' },
                            {
                                type: 'object',
                                properties: {
                                    _id: { type: 'string' },
                                    name: { type: 'string' }
                                }
                            }
                        ]
                    },
                    createdAt: { type: 'string', format: 'date-time' }
                }
            },
            ErrorResponse: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', example: false },
                    message: { type: 'string' }
                }
            },
            SuccessListResponse: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', example: true },
                    count: { type: 'number' },
                    data: { type: 'array', items: {} }
                }
            },
            SuccessObjectResponse: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', example: true },
                    data: {}
                }
            },
            RegisterRequest: {
                type: 'object',
                required: ['name', 'telephone', 'email', 'password'],
                properties: {
                    name: { type: 'string' },
                    telephone: { type: 'string', example: '0812345678' },
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 6 },
                    role: { type: 'string', enum: ['user', 'admin', 'dentist'] }
                }
            },
            LoginRequest: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string' }
                }
            },
            CreateBookingRequest: {
                type: 'object',
                required: ['bookingDate', 'dentist'],
                properties: {
                    bookingDate: { type: 'string', format: 'date-time' },
                    dentist: { type: 'string' }
                }
            },
            UpdateBookingRequest: {
                type: 'object',
                properties: {
                    bookingDate: { type: 'string', format: 'date-time' },
                    dentist: { type: 'string' }
                }
            },
            CreateDentistRequest: {
                type: 'object',
                required: ['name', 'telephone', 'email', 'password'],
                properties: {
                    name: { type: 'string' },
                    telephone: { type: 'string', example: '0812345678' },
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 6 },
                    yearsOfExperience: { type: 'number' },
                    areaOfExpertise: { type: 'string' }
                }
            },
            UpdateDentistRequest: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    yearsOfExperience: { type: 'number' },
                    areaOfExpertise: { type: 'string' }
                }
            },
            CreateReviewRequest: {
                type: 'object',
                required: ['rating', 'comment'],
                properties: {
                    rating: { type: 'number', minimum: 1, maximum: 5 },
                    comment: { type: 'string', maxLength: 500 }
                }
            },
            UpdateReviewRequest: {
                type: 'object',
                properties: {
                    rating: { type: 'number', minimum: 1, maximum: 5 },
                    comment: { type: 'string', maxLength: 500 }
                }
            }
        }
    },
    paths: {
        '/api/auth/register': {
            post: {
                tags: ['Auth'],
                summary: 'Register user',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/RegisterRequest' }
                        }
                    }
                },
                responses: {
                    201: {
                        description: 'Registered successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean' },
                                        data: { $ref: '#/components/schemas/User' },
                                        token: { type: 'string' }
                                    }
                                }
                            }
                        }
                    },
                    400: {
                        description: 'Validation error',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ErrorResponse' }
                            }
                        }
                    }
                }
            }
        },
        '/api/auth/login': {
            post: {
                tags: ['Auth'],
                summary: 'Login user',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/LoginRequest' }
                        }
                    }
                },
                responses: {
                    200: {
                        description: 'Logged in successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean' },
                                        data: { $ref: '#/components/schemas/User' },
                                        token: { type: 'string' }
                                    }
                                }
                            }
                        }
                    },
                    400: {
                        description: 'Invalid credentials',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ErrorResponse' }
                            }
                        }
                    },
                    401: {
                        description: 'Unauthorized',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ErrorResponse' }
                            }
                        }
                    }
                }
            }
        },
        '/api/auth/me': {
            get: {
                tags: ['Auth'],
                summary: 'Get current user',
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                responses: {
                    200: {
                        description: 'Current user profile',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean' },
                                        data: { $ref: '#/components/schemas/User' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        '/api/auth/logout': {
            get: {
                tags: ['Auth'],
                summary: 'Logout current user',
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                responses: {
                    200: {
                        description: 'Logged out',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean' },
                                        data: { type: 'object' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        '/api/bookings': {
            get: {
                tags: ['Bookings'],
                summary: 'Get bookings by role',
                description: 'Admin gets all bookings, user gets own bookings, dentist gets assigned bookings.',
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                responses: {
                    200: {
                        description: 'Bookings list',
                        content: {
                            'application/json': {
                                schema: {
                                    allOf: [
                                        { $ref: '#/components/schemas/SuccessListResponse' },
                                        {
                                            type: 'object',
                                            properties: {
                                                data: {
                                                    type: 'array',
                                                    items: { $ref: '#/components/schemas/Booking' }
                                                }
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    }
                }
            },
            post: {
                tags: ['Bookings'],
                summary: 'Create booking (user only)',
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/CreateBookingRequest' }
                        }
                    }
                },
                responses: {
                    201: {
                        description: 'Booking created',
                        content: {
                            'application/json': {
                                schema: {
                                    allOf: [
                                        { $ref: '#/components/schemas/SuccessObjectResponse' },
                                        {
                                            type: 'object',
                                            properties: {
                                                data: { $ref: '#/components/schemas/Booking' }
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    },
                    400: {
                        description: 'Business rule violation',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ErrorResponse' }
                            }
                        }
                    }
                }
            }
        },
        '/api/bookings/{id}': {
            get: {
                tags: ['Bookings'],
                summary: 'Get booking by id',
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string' }
                    }
                ],
                responses: {
                    200: {
                        description: 'Booking detail',
                        content: {
                            'application/json': {
                                schema: {
                                    allOf: [
                                        { $ref: '#/components/schemas/SuccessObjectResponse' },
                                        {
                                            type: 'object',
                                            properties: {
                                                data: { $ref: '#/components/schemas/Booking' }
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    },
                    403: {
                        description: 'Forbidden',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ErrorResponse' }
                            }
                        }
                    },
                    404: {
                        description: 'Not found',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ErrorResponse' }
                            }
                        }
                    }
                }
            },
            put: {
                tags: ['Bookings'],
                summary: 'Update booking',
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string' }
                    }
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/UpdateBookingRequest' }
                        }
                    }
                },
                responses: {
                    200: {
                        description: 'Booking updated',
                        content: {
                            'application/json': {
                                schema: {
                                    allOf: [
                                        { $ref: '#/components/schemas/SuccessObjectResponse' },
                                        {
                                            type: 'object',
                                            properties: {
                                                data: { $ref: '#/components/schemas/Booking' }
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    }
                }
            },
            delete: {
                tags: ['Bookings'],
                summary: 'Delete booking',
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string' }
                    }
                ],
                responses: {
                    200: {
                        description: 'Booking deleted',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean' },
                                        data: { type: 'object' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        '/api/bookings/availability': {
            get: {
                tags: ['Bookings'],
                summary: 'View dentist availability',
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                responses: {
                    200: {
                        description: 'Booking availability list',
                        content: {
                            'application/json': {
                                schema: {
                                    allOf: [
                                        { $ref: '#/components/schemas/SuccessListResponse' },
                                        {
                                            type: 'object',
                                            properties: {
                                                data: {
                                                    type: 'array',
                                                    items: { $ref: '#/components/schemas/Booking' }
                                                }
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    }
                }
            }
        },
        '/api/dentist': {
            get: {
                tags: ['Dentists'],
                summary: 'Get all dentists',
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                responses: {
                    200: {
                        description: 'Dentists list',
                        content: {
                            'application/json': {
                                schema: {
                                    allOf: [
                                        { $ref: '#/components/schemas/SuccessListResponse' },
                                        {
                                            type: 'object',
                                            properties: {
                                                data: {
                                                    type: 'array',
                                                    items: { $ref: '#/components/schemas/User' }
                                                }
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    }
                }
            },
            post: {
                tags: ['Dentists'],
                summary: 'Create dentist (admin only)',
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/CreateDentistRequest' }
                        }
                    }
                },
                responses: {
                    201: {
                        description: 'Dentist created',
                        content: {
                            'application/json': {
                                schema: {
                                    allOf: [
                                        { $ref: '#/components/schemas/SuccessObjectResponse' },
                                        {
                                            type: 'object',
                                            properties: {
                                                data: { $ref: '#/components/schemas/User' }
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    }
                }
            }
        },
        '/api/dentist/{id}': {
            get: {
                tags: ['Dentists'],
                summary: 'Get dentist by id',
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string' }
                    }
                ],
                responses: {
                    200: {
                        description: 'Dentist detail',
                        content: {
                            'application/json': {
                                schema: {
                                    allOf: [
                                        { $ref: '#/components/schemas/SuccessObjectResponse' },
                                        {
                                            type: 'object',
                                            properties: {
                                                data: { $ref: '#/components/schemas/User' }
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    }
                }
            },
            put: {
                tags: ['Dentists'],
                summary: 'Update dentist (admin only)',
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string' }
                    }
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/UpdateDentistRequest' }
                        }
                    }
                },
                responses: {
                    200: {
                        description: 'Dentist updated',
                        content: {
                            'application/json': {
                                schema: {
                                    allOf: [
                                        { $ref: '#/components/schemas/SuccessObjectResponse' },
                                        {
                                            type: 'object',
                                            properties: {
                                                data: { $ref: '#/components/schemas/User' }
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    }
                }
            },
            delete: {
                tags: ['Dentists'],
                summary: 'Delete dentist (admin only)',
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string' }
                    }
                ],
                responses: {
                    200: {
                        description: 'Dentist deleted',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean' },
                                        data: { type: 'object' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        '/api/dentist/{dentistId}/reviews': {
            get: {
                tags: ['Reviews'],
                summary: 'Get reviews for dentist',
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                parameters: [
                    {
                        name: 'dentistId',
                        in: 'path',
                        required: true,
                        schema: { type: 'string' }
                    }
                ],
                responses: {
                    200: {
                        description: 'Review list',
                        content: {
                            'application/json': {
                                schema: {
                                    allOf: [
                                        { $ref: '#/components/schemas/SuccessListResponse' },
                                        {
                                            type: 'object',
                                            properties: {
                                                data: {
                                                    type: 'array',
                                                    items: { $ref: '#/components/schemas/Review' }
                                                }
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    }
                }
            },
            post: {
                tags: ['Reviews'],
                summary: 'Create review for dentist (user only)',
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                parameters: [
                    {
                        name: 'dentistId',
                        in: 'path',
                        required: true,
                        schema: { type: 'string' }
                    }
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/CreateReviewRequest' }
                        }
                    }
                },
                responses: {
                    201: {
                        description: 'Review created',
                        content: {
                            'application/json': {
                                schema: {
                                    allOf: [
                                        { $ref: '#/components/schemas/SuccessObjectResponse' },
                                        {
                                            type: 'object',
                                            properties: {
                                                data: { $ref: '#/components/schemas/Review' }
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    }
                }
            }
        },
        '/api/reviews/{id}': {
            get: {
                tags: ['Reviews'],
                summary: 'Get review by id',
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string' }
                    }
                ],
                responses: {
                    200: {
                        description: 'Review detail',
                        content: {
                            'application/json': {
                                schema: {
                                    allOf: [
                                        { $ref: '#/components/schemas/SuccessObjectResponse' },
                                        {
                                            type: 'object',
                                            properties: {
                                                data: { $ref: '#/components/schemas/Review' }
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    }
                }
            },
            put: {
                tags: ['Reviews'],
                summary: 'Update review (owner only)',
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string' }
                    }
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/UpdateReviewRequest' }
                        }
                    }
                },
                responses: {
                    200: {
                        description: 'Review updated',
                        content: {
                            'application/json': {
                                schema: {
                                    allOf: [
                                        { $ref: '#/components/schemas/SuccessObjectResponse' },
                                        {
                                            type: 'object',
                                            properties: {
                                                data: { $ref: '#/components/schemas/Review' }
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    }
                }
            },
            delete: {
                tags: ['Reviews'],
                summary: 'Delete review (owner or admin)',
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string' }
                    }
                ],
                responses: {
                    200: {
                        description: 'Review deleted',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean' },
                                        data: { type: 'object' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
};

module.exports = openApiSpec;
