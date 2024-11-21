;; Zero-Knowledge Proof Voting System

;; Define data vars
(define-data-var contract-owner principal tx-sender)
(define-data-var total-votes uint u0)
(define-data-var voting-open bool true)

;; Define data maps
(define-map voters principal bool)
(define-map votes principal uint)
(define-map vote-hashes (buff 32) bool)

;; Error codes
(define-constant ERR-ALREADY-VOTED u1)
(define-constant ERR-NOT-REGISTERED u2)
(define-constant ERR-VOTING-CLOSED u3)

;; Register a voter
(define-public (register-voter)
  (begin
    (asserts! (is-none (map-get? voters tx-sender)) (err u"Already registered"))
    (map-set voters tx-sender true)
    (ok true)))

;; Submit a vote
(define-public (submit-vote (vote-hash (buff 32)))
  (let ((voter tx-sender))
    (asserts! (var-get voting-open) (err ERR-VOTING-CLOSED))
    (asserts! (is-some (map-get? voters voter)) (err ERR-NOT-REGISTERED))
    (asserts! (is-none (map-get? votes voter)) (err ERR-ALREADY-VOTED))

    (map-set votes voter u1)
    (map-set vote-hashes vote-hash true)
    (var-set total-votes (+ (var-get total-votes) u1))

    (ok true)))

;; Verify a vote
(define-read-only (verify-vote (vote-hash (buff 32)))
  (default-to false (map-get? vote-hashes vote-hash)))

;; Get total votes
(define-read-only (get-total-votes)
  (var-get total-votes))

;; Close voting
(define-public (close-voting)
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) (err u"Not authorized"))
    (var-set voting-open false)
    (ok true)))

;; Check if voting is open
(define-read-only (is-voting-open)
  (var-get voting-open))

