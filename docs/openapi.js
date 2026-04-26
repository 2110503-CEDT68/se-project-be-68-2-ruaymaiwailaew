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
                    _id: { type: 'string', example: '664f1b2c9e1a2b3c4d5e6f70' },
                    name: { type: 'string', example: 'John Doe' },
                    telephone: { type: 'string', example: '0812345678' },
                    email: { type: 'string', format: 'email', example: 'john@example.com' },
                    role: { type: 'string', enum: ['user', 'admin', 'dentist'] },
                    yearsOfExperience: { type: 'number', nullable: true, example: 5 },
                    areaOfExpertise: { type: 'string', nullable: true, example: 'Orthodontics' },
                    isBanned: { type: 'boolean', example: false },
                    isDeleted: { type: 'boolean', example: false },
                    bannedAt: { type: 'string', format: 'date-time', nullable: true },
                    banReason: { type: 'string', nullable: true },
                    deletedAt: { type: 'string', format: 'date-time', nullable: true },
                    privacyPolicyAccepted: { type: 'boolean', example: true },
                    createdAt: { type: 'string', format: 'date-time' }
                }
            },
            Booking: {
                type: 'object',
                properties: {
                    _id: { type: 'string', example: '664f1b2c9e1a2b3c4d5e6f71' },
                    bookingDate: { type: 'string', format: 'date-time', example: '2024-12-01T10:00:00.000Z' },
                    user: {
                        oneOf: [
                            { type: 'string', example: '664f1b2c9e1a2b3c4d5e6f70' },
                            {
                                type: 'object',
                                properties: {
                                    _id: { type: 'string', example: '664f1b2c9e1a2b3c4d5e6f70' },
                                    name: { type: 'string', example: 'John Doe' },
                                    email: { type: 'string', format: 'email', example: 'john@example.com' },
                                    telephone: { type: 'string', example: '0812345678' }
                                }
                            }
                        ]
                    },
                    dentist: {
                        oneOf: [
                            { type: 'string', example: '664f1b2c9e1a2b3c4d5e6f72' },
                            {
                                type: 'object',
                                properties: {
                                    _id: { type: 'string', example: '664f1b2c9e1a2b3c4d5e6f72' },
                                    name: { type: 'string', example: 'Dr. Jane Smith' },
                                    email: { type: 'string', format: 'email', example: 'jane@example.com' },
                                    yearsOfExperience: { type: 'number', example: 10 },
                                    areaOfExpertise: { type: 'string', example: 'Orthodontics' }
                                }
                            }
                        ]
                    },
                    createdAt: { type: 'string', format: 'date-time', example: '2024-12-01T10:00:00.000Z' }
                }
            },
            Review: {
                type: 'object',
                properties: {
                    _id: { type: 'string', example: '664f1b2c9e1a2b3c4d5e6f73' },
                    rating: { type: 'number', minimum: 1, maximum: 5, example: 4 },
                    comment: { type: 'string', maxLength: 500, example: 'Great service!' },
                    dentist: {
                        oneOf: [
                            { type: 'string', example: '664f1b2c9e1a2b3c4d5e6f72' },
                            {
                                type: 'object',
                                properties: {
                                    _id: { type: 'string', example: '664f1b2c9e1a2b3c4d5e6f72' },
                                    name: { type: 'string', example: 'Dr. Jane Smith' }
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
                    message: { type: 'string', example: 'Error description' }
                }
            },
            SuccessListResponse: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', example: true },
                    count: { type: 'number', example: 2 },
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
            SuccessMessageResponse: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string' },
                    data: { type: 'object' }
                }
            },
            RegisterRequest: {
                type: 'object',
                required: ['name', 'telephone', 'email', 'password', 'privacyPolicyAccepted'],
                properties: {
                    name: { type: 'string', example: 'John Doe' },
                    telephone: { type: 'string', example: '0812345678' },
                    email: { type: 'string', format: 'email', example: 'john.doe@example.com' },
                    password: { type: 'string', minLength: 6, example: 'password123' },
                    role: { type: 'string', enum: ['user', 'admin', 'dentist'], default: 'user' },
                    privacyPolicyAccepted: {
                        type: 'boolean',
                        example: true,
                        description: 'Must be true to complete registration'
                    },
                    yearsOfExperience: {
                        type: 'number',
                        example: 5,
                        description: 'Required when role is dentist'
                    },
                    areaOfExpertise: {
                        type: 'string',
                        example: 'Orthodontics',
                        description: 'Required when role is dentist'
                    }
                }
            },
            LoginRequest: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                    email: { type: 'string', format: 'email', example: 'john@example.com' },
                    password: { type: 'string', example: 'password123' }
                }
            },
            AuthResponse: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/User' },
                    token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
                }
            },
            DeleteAccountRequest: {
                type: 'object',
                required: ['password'],
                properties: {
                    password: { type: 'string', example: 'secret123', description: 'Current password to confirm deletion' }
                }
            },
            BanUserRequest: {
                type: 'object',
                required: ['userId'],
                properties: {
                    userId: { type: 'string', example: '664f1b2c9e1a2b3c4d5e6f70' },
                    reason: { type: 'string', example: 'Violated terms of service' }
                }
            },
            UnbanUserRequest: {
                type: 'object',
                required: ['userId'],
                properties: {
                    userId: { type: 'string', example: '664f1b2c9e1a2b3c4d5e6f70' }
                }
            },
            UpdateProfileRequest: {
                type: 'object',
                required: ['password'],
                properties: {
                    password: { type: 'string', example: 'secret123', description: 'Current password to confirm changes' },
                    name: { type: 'string', example: 'Jane Doe' },
                    telephone: { type: 'string', example: '0899999999' },
                    areaOfExpertise: { type: 'string', example: 'Orthodontics', description: 'Required when role is dentist' },
                    yearsOfExperience: { type: 'number', example: 6, description: 'Required when role is dentist' }
                }
            },
            CreateBookingRequest: {
                type: 'object',
                required: ['bookingDate', 'dentist'],
                properties: {
                    bookingDate: { type: 'string', format: 'date-time', example: '2024-12-01T10:00:00.000Z' },
                    dentist: { type: 'string', example: '664f1b2c9e1a2b3c4d5e6f72', description: 'Dentist user _id' }
                }
            },
            UpdateBookingRequest: {
                type: 'object',
                properties: {
                    bookingDate: { type: 'string', format: 'date-time', example: '2024-12-05T14:00:00.000Z' },
                    dentist: { type: 'string', example: '664f1b2c9e1a2b3c4d5e6f72' }
                }
            },
            CreateDentistRequest: {
                type: 'object',
                required: ['name', 'telephone', 'email', 'password'],
                properties: {
                    name: { type: 'string', example: 'Dr. Smith' },
                    telephone: { type: 'string', example: '0812345678' },
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 6 },
                    yearsOfExperience: { type: 'number', example: 10 },
                    areaOfExpertise: { type: 'string', example: 'Orthodontics' }
                }
            },
            UpdateDentistRequest: {
                type: 'object',
                properties: {
                    name: { type: 'string', example: 'Dr. Smith Jr.' },
                    yearsOfExperience: { type: 'number', example: 11 },
                    areaOfExpertise: { type: 'string', example: 'Periodontics' }
                }
            },
            CreateReviewRequest: {
                type: 'object',
                required: ['rating', 'comment'],
                properties: {
                    rating: { type: 'number', minimum: 1, maximum: 5, example: 5 },
                    comment: { type: 'string', maxLength: 500, example: 'Excellent experience!' }
                }
            },
            UpdateReviewRequest: {
                type: 'object',
                properties: {
                    rating: { type: 'number', minimum: 1, maximum: 5, example: 4 },
                    comment: { type: 'string', maxLength: 500, example: 'Updated comment.' }
                }
            }
        },
        responses: {
            Unauthorized: {
                description: 'Missing or invalid authentication token',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/ErrorResponse' },
                        example: { success: false, message: 'Not authorized to access this route' }
                    }
                }
            },
            Forbidden: {
                description: 'Authenticated but not allowed to perform this action',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/ErrorResponse' },
                        example: { success: false, message: 'Forbidden' }
                    }
                }
            },
            NotFound: {
                description: 'Resource not found',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/ErrorResponse' },
                        example: { success: false, message: 'Resource not found' }
                    }
                }
            },
            InternalError: {
                description: 'Unexpected server error',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/ErrorResponse' },
                        example: { success: false, message: 'Internal server error' }
                    }
                }
            }
        },
        parameters: {
            IdParam: {
                name: 'id',
                in: 'path',
                required: true,
                schema: { type: 'string', example: '664f1b2c9e1a2b3c4d5e6f70' }
            },
            DentistIdParam: {
                name: 'dentistId',
                in: 'path',
                required: true,
                schema: { type: 'string', example: '664f1b2c9e1a2b3c4d5e6f72' }
            }
        }
    },
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
    paths: {
        '/api/auth/register': {
            post: {
                tags: ['Auth'],
                summary: 'Register a new user',
                description: 'Creates a new account. `privacyPolicyAccepted` must be `true`. When `role` is `dentist`, `yearsOfExperience` and `areaOfExpertise` are also stored.',
                security: [],
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
                        description: 'Registered successfully – JWT returned in body and cookie',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/AuthResponse' }
                            }
                        }
                    },
                    400: {
                        description: 'Validation error or privacy policy not accepted',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ErrorResponse' }
                            }
                        }
                    },
                    409: {
                        description: 'Email already in use (or previously deleted)',
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
                    }
                }
            }
        },
        '/api/auth/login': {
            post: {
                tags: ['Auth'],
                summary: 'Login user',
                description: 'Returns JWT in response body and sets `token` cookie. Returns 403 if account is banned or deleted.',
                security: [],
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
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } }
                    },
                    400: {
                        description: 'Missing email or password',
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
                    },
                    401: {
                        description: 'Invalid credentials',
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
                    },
                    403: {
                        description: 'Account is banned or deleted',
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
                    }
                }
            }
        },
        '/api/auth/me': {
            get: {
                tags: ['Auth'],
                summary: 'Get current user profile',
                description: 'Returns the authenticated user. Returns 403 if account is banned or deleted.',
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                responses: {
                    200: {
                        description: 'Current user profile',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean', example: true },
                                        data: { $ref: '#/components/schemas/User' }
                                    }
                                }
                            }
                        }
                    },
                    400: {
                        description: 'Account has been deleted',
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
                    },
                    401: { $ref: '#/components/responses/Unauthorized' },
                    403: {
                        description: 'Account is banned',
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
                    },
                    404: {
                        description: 'User not found',
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
                    }
                }
            }
        },
        '/api/auth/logout': {
            get: {
                tags: ['Auth'],
                summary: 'Logout current user',
                description: 'Clears the `token` cookie.',
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                responses: {
                    200: {
                        description: 'Logged out successfully',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/SuccessMessageResponse' },
                                example: { success: true, message: 'Logged out successfully', data: {} }
                            }
                        }
                    }
                }
            }
        },
        '/api/auth/deleteaccount': {
            post: {
                tags: ['Auth'],
                summary: 'Soft-delete own account',
                description: 'Requires current password to confirm. Marks account as deleted (`isDeleted: true`) and clears the auth cookie. Does **not** hard-delete data.',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/DeleteAccountRequest' }
                        }
                    }
                },
                responses: {
                    200: {
                        description: 'Account deleted successfully',
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessMessageResponse' } } }
                    },
                    400: {
                        description: 'Password not provided',
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
                    },
                    401: {
                        description: 'Incorrect password',
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
                    },
                    404: { $ref: '#/components/responses/NotFound' },
                    410: {
                        description: 'Account has already been deleted',
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
                    }
                }
            }
        },
        '/api/auth/updateprofile': {
            put: {
                tags: ['Auth'],
                summary: 'Update own profile',
                description: 'Requires current password to confirm. Updatable fields: `name`, `telephone`, `areaOfExpertise`, `yearsOfExperience`. At least one field (besides `password`) must be provided.',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/UpdateProfileRequest' }
                        }
                    }
                },
                responses: {
                    200: {
                        description: 'Profile updated successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean', example: true },
                                        data: { $ref: '#/components/schemas/User' },
                                        message: { type: 'string', example: 'Profile updated successfully' }
                                    }
                                }
                            }
                        }
                    },
                    400: {
                        description: 'No fields to update or password not provided',
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
                    },
                    401: {
                        description: 'Incorrect password',
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
                    },
                    404: { $ref: '#/components/responses/NotFound' }
                }
            }
        },
        '/api/auth/ban': {
            post: {
                tags: ['Auth'],
                summary: 'Ban a user or dentist (admin only)',
                description: 'Bans the specified account. Requires admin role.',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/BanUserRequest' }
                        }
                    }
                },
                responses: {
                    200: {
                        description: 'User banned successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean', example: true },
                                        message: { type: 'string', example: 'user has been banned successfully' },
                                        data: {
                                            type: 'object',
                                            properties: {
                                                userId: { type: 'string' },
                                                email: { type: 'string', format: 'email' },
                                                bannedAt: { type: 'string', format: 'date-time' },
                                                banReason: { type: 'string' }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    400: {
                        description: 'userId not provided or user already banned',
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
                    },
                    401: { $ref: '#/components/responses/Unauthorized' },
                    403: { $ref: '#/components/responses/Forbidden' },
                    404: { $ref: '#/components/responses/NotFound' }
                }
            }
        },
        '/api/auth/unban': {
            post: {
                tags: ['Auth'],
                summary: 'Unban a user or dentist (admin only)',
                description: 'Lifts the ban from the specified account. Requires admin role.',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/UnbanUserRequest' }
                        }
                    }
                },
                responses: {
                    200: {
                        description: 'User unbanned successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean', example: true },
                                        message: { type: 'string', example: 'user has been unbanned successfully' },
                                        data: {
                                            type: 'object',
                                            properties: {
                                                userId: { type: 'string' },
                                                email: { type: 'string', format: 'email' }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    400: {
                        description: 'userId not provided or user is not banned',
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
                    },
                    401: { $ref: '#/components/responses/Unauthorized' },
                    403: { $ref: '#/components/responses/Forbidden' },
                    404: { $ref: '#/components/responses/NotFound' }
                }
            }
        },
        '/api/auth/getusers': {
            get: {
                tags: ['Auth'],
                summary: 'Get all users and dentists (admin only)',
                description: 'Returns all non-deleted users and dentists. Requires admin role.',
                responses: {
                    200: {
                        description: 'List of users and dentists',
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
                    },
                    401: { $ref: '#/components/responses/Unauthorized' },
                    403: { $ref: '#/components/responses/Forbidden' }
                }
            }
        },
        '/api/bookings': {
            get: {
                tags: ['Bookings'],
                summary: 'Get bookings by role',
                description: '- **Admin**: all bookings\n- **User**: own bookings\n- **Dentist**: bookings assigned to them\n\nBookings from banned/deleted users or dentists are filtered out.',
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
                description: 'A user can only have **one** active booking at a time. The chosen dentist must be available (no other booking on the same calendar day). Sends an email notification to the dentist.',
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
                        description: 'Already has a booking, dentist unavailable, missing fields, or account banned/deleted',
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
                    },
                    401: { $ref: '#/components/responses/Unauthorized' },
                    403: { $ref: '#/components/responses/Forbidden' }
                }
            }
        },
        '/api/bookings/availability': {
            get: {
                tags: ['Bookings'],
                summary: 'View dentist availability',
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                description: 'Returns all bookings (from non-banned/deleted users and dentists) so clients can determine which dentists and dates are taken.',
                responses: {
                    200: {
                        description: 'Availability list',
                        content: {
                            'application/json': {
                                schema: {
                                    allOf: [
                                        { $ref: '#/components/schemas/SuccessListResponse' },
                                        {
                                            type: 'object',
                                            properties: {
                                                data: { type: 'array', items: { $ref: '#/components/schemas/Booking' } }
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    },
                    500: { $ref: '#/components/responses/InternalError' }
                }
            }
        },
        '/api/bookings/{id}': {
            get: {
                tags: ['Bookings'],
                summary: 'Get booking by id',
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                description: '- **Admin**: any booking\n- **User**: own bookings only\n- **Dentist**: bookings assigned to them only',
                parameters: [{ $ref: '#/components/parameters/IdParam' }],
                responses: {
                    200: {
                        description: 'Booking detail',
                        content: {
                            'application/json': {
                                schema: {
                                    allOf: [
                                        { $ref: '#/components/schemas/SuccessObjectResponse' },
                                        { type: 'object', properties: { data: { $ref: '#/components/schemas/Booking' } } }
                                    ]
                                }
                            }
                        }
                    },
                    403: { $ref: '#/components/responses/Forbidden' },
                    404: { $ref: '#/components/responses/NotFound' }
                }
            },
            put: {
                tags: ['Bookings'],
                summary: 'Update booking',
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                description: 'Admin can update any booking. User/Dentist can only update their own. Validates dentist availability for the new date. Sends an email notification to the other party.',
                parameters: [{ $ref: '#/components/parameters/IdParam' }],
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
                                        { type: 'object', properties: { data: { $ref: '#/components/schemas/Booking' } } }
                                    ]
                                }
                            }
                        }
                    },
                    400: {
                        description: 'Dentist unavailable on the requested date',
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
                    },
                    403: { $ref: '#/components/responses/Forbidden' },
                    404: { $ref: '#/components/responses/NotFound' }
                }
            },
            delete: {
                tags: ['Bookings'],
                summary: 'Delete booking',
                description: 'Admin can delete any booking. User/Dentist can only delete their own. Sends an email notification to the other party.',
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                parameters: [{ $ref: '#/components/parameters/IdParam' }],
                responses: {
                    200: {
                        description: 'Booking deleted',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/SuccessMessageResponse' },
                                example: { success: true, data: {} }
                            }
                        }
                    },
                    403: { $ref: '#/components/responses/Forbidden' },
                    404: { $ref: '#/components/responses/NotFound' }
                }
            }
        },
        '/api/dentist': {
            get: {
                tags: ['Dentists'],
                summary: 'Get all dentists',
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                description: 'Returns all non-deleted, non-banned dentist accounts.',
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
                                                data: { type: 'array', items: { $ref: '#/components/schemas/User' } }
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    },
                    500: { $ref: '#/components/responses/InternalError' }
                }
            },
            post: {
                tags: ['Dentists'],
                summary: 'Create dentist (admin only)',
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                description: 'Admin creates a dentist account directly (no `privacyPolicyAccepted` required). Password is hashed automatically.',
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
                                        { type: 'object', properties: { data: { $ref: '#/components/schemas/User' } } }
                                    ]
                                }
                            }
                        }
                    },
                    403: { $ref: '#/components/responses/Forbidden' },
                    500: { $ref: '#/components/responses/InternalError' }
                }
            }
        },
        '/api/dentist/{id}': {
            get: {
                tags: ['Dentists'],
                summary: 'Get dentist by id',
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                description: 'Returns 404 if the dentist is deleted, banned, or the id belongs to a non-dentist user.',
                parameters: [{ $ref: '#/components/parameters/IdParam' }],
                responses: {
                    200: {
                        description: 'Dentist detail',
                        content: {
                            'application/json': {
                                schema: {
                                    allOf: [
                                        { $ref: '#/components/schemas/SuccessObjectResponse' },
                                        { type: 'object', properties: { data: { $ref: '#/components/schemas/User' } } }
                                    ]
                                }
                            }
                        }
                    },
                    404: { $ref: '#/components/responses/NotFound' },
                    500: { $ref: '#/components/responses/InternalError' }
                }
            },
            put: {
                tags: ['Dentists'],
                summary: 'Update dentist (admin only)',
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                description: 'Updates `name`, `yearsOfExperience`, `areaOfExpertise`. Returns 404 if id is not a dentist.',
                parameters: [{ $ref: '#/components/parameters/IdParam' }],
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateDentistRequest' } } }
                },
                responses: {
                    200: {
                        description: 'Dentist updated',
                        content: {
                            'application/json': {
                                schema: {
                                    allOf: [
                                        { $ref: '#/components/schemas/SuccessObjectResponse' },
                                        { type: 'object', properties: { data: { $ref: '#/components/schemas/User' } } }
                                    ]
                                }
                            }
                        }
                    },
                    403: { $ref: '#/components/responses/Forbidden' },
                    404: { $ref: '#/components/responses/NotFound' },
                    500: { $ref: '#/components/responses/InternalError' }
                }
            },
            delete: {
                tags: ['Dentists'],
                summary: 'Delete dentist (admin only)',
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                description: 'Hard-deletes the dentist and **cascades**: also deletes all associated bookings and reviews.',
                parameters: [{ $ref: '#/components/parameters/IdParam' }],
                responses: {
                    200: { description: 'Dentist deleted', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessMessageResponse' } } } },
                    403: { $ref: '#/components/responses/Forbidden' },
                    404: { $ref: '#/components/responses/NotFound' },
                    500: { $ref: '#/components/responses/InternalError' }
                }
            }
        },
        '/api/dentist/{dentistId}/reviews': {
            get: {
                tags: ['Reviews'],
                summary: 'Get reviews for dentist',
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                description: 'Returns reviews where neither user nor dentist is deleted or banned.',
                parameters: [{ $ref: '#/components/parameters/DentistIdParam' }],
                responses: {
                    200: {
                        description: 'Review list',
                        content: {
                            'application/json': {
                                schema: {
                                    allOf: [
                                        { $ref: '#/components/schemas/SuccessListResponse' },
                                        { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/Review' } } } }
                                    ]
                                }
                            }
                        }
                    },
                    500: { $ref: '#/components/responses/InternalError' }
                }
            },
            post: {
                tags: ['Reviews'],
                summary: 'Create review for dentist (user only)',
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                description: 'A user can leave **one** review per dentist. Returns 403 if banned/deleted or already reviewed.',
                parameters: [{ $ref: '#/components/parameters/DentistIdParam' }],
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateReviewRequest' } } }
                },
                responses: {
                    201: {
                        description: 'Review created',
                        content: {
                            'application/json': {
                                schema: {
                                    allOf: [
                                        { $ref: '#/components/schemas/SuccessObjectResponse' },
                                        { type: 'object', properties: { data: { $ref: '#/components/schemas/Review' } } }
                                    ]
                                }
                            }
                        }
                    },
                    403: { description: 'Account banned/deleted or review already exists', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
                    404: { description: 'Dentist not found / deleted / banned', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
                    500: { $ref: '#/components/responses/InternalError' }
                }
            }
        },
        '/api/reviews/{id}': {
            get: {
                tags: ['Reviews'],
                summary: 'Get review by id',
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                parameters: [{ $ref: '#/components/parameters/IdParam' }],
                responses: {
                    200: {
                        description: 'Review detail',
                        content: {
                            'application/json': {
                                schema: {
                                    allOf: [
                                        { $ref: '#/components/schemas/SuccessObjectResponse' },
                                        { type: 'object', properties: { data: { $ref: '#/components/schemas/Review' } } }
                                    ]
                                }
                            }
                        }
                    },
                    404: { $ref: '#/components/responses/NotFound' },
                    500: { $ref: '#/components/responses/InternalError' }
                }
            },
            put: {
                tags: ['Reviews'],
                summary: 'Update review (owner only)',
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                description: 'Only the review owner can update. `user` and `dentist` fields in the body are ignored.',
                parameters: [{ $ref: '#/components/parameters/IdParam' }],
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateReviewRequest' } } }
                },
                responses: {
                    200: {
                        description: 'Review updated',
                        content: {
                            'application/json': {
                                schema: {
                                    allOf: [
                                        { $ref: '#/components/schemas/SuccessObjectResponse' },
                                        { type: 'object', properties: { data: { $ref: '#/components/schemas/Review' } } }
                                    ]
                                }
                            }
                        }
                    },
                    403: { $ref: '#/components/responses/Forbidden' },
                    404: { $ref: '#/components/responses/NotFound' },
                    500: { $ref: '#/components/responses/InternalError' }
                }
            },
            delete: {
                tags: ['Reviews'],
                summary: 'Delete review (owner or admin)',
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                parameters: [{ $ref: '#/components/parameters/IdParam' }],
                responses: {
                    200: { description: 'Review deleted', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessMessageResponse' } } } },
                    403: { $ref: '#/components/responses/Forbidden' },
                    404: { $ref: '#/components/responses/NotFound' },
                    500: { $ref: '#/components/responses/InternalError' }
                }
            }
        }
    }
};

module.exports = openApiSpec;
